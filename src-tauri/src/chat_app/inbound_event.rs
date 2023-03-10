use std::collections::hash_map;

use crate::{
    error::NetworkError,
    managers::{AppManager, HandleInboundEvent},
    network::{
        message::{self, InboundEvent},
        Client,
    },
};

use futures::{
    future::{join_all, try_join_all},
    FutureExt,
};
use tokio::sync::mpsc;

use super::{frontend_event::FrontendEvent, AppState};

pub struct InboundEventLoop {
    pub(super) client: Client,
    pub(super) inbound_event_receiver: mpsc::Receiver<message::InboundEvent>,
    pub(super) frontend_sender: mpsc::Sender<FrontendEvent>,
    pub(super) state: AppState,
    pub(super) managers: Vec<Box<dyn AppManager>>,
}

impl InboundEventLoop {
    pub async fn run(mut self) -> Result<(), NetworkError> {
        while let Some(event) = self.inbound_event_receiver.recv().await {
            let iter = self.managers.iter_mut().map(|manager| {
                let event = event.clone();
                let client = self.client.clone();
                let state = self.state.clone();
                let sender = self.frontend_sender.clone();
                async move {
                    match manager.handle_event(event, client, state, sender).await {
                        Ok(_) => {}
                        Err(err) => {
                            log::error!("{} manager occured an error: {}", manager.name(), err)
                        }
                    };
                }
                .boxed()
            });
            join_all(iter).await;
            self.handle_event_default(event).await?;
        }
        Ok(())
    }

    async fn handle_event_default(&mut self, event: InboundEvent) -> Result<(), NetworkError> {
        match event {
            InboundEvent::InboundRequest { request, channel } => {
                if let Some(_channel) = channel.lock().await.take() {
                    log::warn!("request not handled {request:?}");
                }
            }
            InboundEvent::NewListenAddr {
                listener_id,
                address,
            } => {
                let addresses = self
                    .client
                    .listeners
                    .lock()
                    .await
                    .entry(listener_id)
                    .and_modify(|e| e.push(address.clone()))
                    .or_default()
                    .clone();

                self.frontend_sender
                    .send(FrontendEvent::Listen {
                        listener_id,
                        addresses,
                    })
                    .await
                    .unwrap();
            }

            InboundEvent::ListenerClosed {
                listener_id,
                addresses,
            } => {
                let mut listeners = self.client.listeners.lock().await;
                let e = listeners
                    .entry(listener_id)
                    .and_modify(|e| e.retain(|x| !addresses.contains(&x)));

                if let hash_map::Entry::Occupied(mut oe) = e {
                    let addr = oe.get_mut();
                    addr.retain(|x| !addresses.contains(&x));
                    self.frontend_sender
                        .send(FrontendEvent::Listen {
                            listener_id,
                            addresses: addr.clone(),
                        })
                        .await
                        .unwrap();
                    addr.is_empty().then(|| oe.remove());
                }
            }
            _ => {}
        }
        Ok(())
    }
}
