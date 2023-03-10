import { invoke } from "@tauri-apps/api";
import {
  FileInfo,
  GroupId,
  GroupInfo,
  GroupMessage,
  GroupState,
  Message,
  PeerId,
  Setting,
  UserInfo,
} from "./types";

export async function startListen(listenAddr?: string) {
  try {
    await invoke<string>("start_listen", {
      listenAddr,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function getLocalPeerId(): Promise<string> {
  return await invoke<PeerId>("get_local_peer_id");
}
export async function stopListen() {
  try {
    await invoke("stop_listen");
  } catch (err) {
    console.error(err);
  }
}

export async function getListeners(): Promise<{ [index: number]: string[] }> {
  try {
    return await invoke<{ [index: number]: string[] }>("get_listeners");
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getFile(file: FileInfo) {
  await invoke("get_file", {
    file,
  }).catch((err) => {
    console.error(err);
  });
}
export async function startProvide(
  path: string,
  file?: FileInfo
): Promise<FileInfo> {
  try {
    const resfile = await invoke<FileInfo>("start_provide", { path, file });
    return resfile;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function stopProvide(file: FileInfo) {
  try {
    await invoke("stop_provide", { file });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function loadSetting(loadPath?: string) {
  try {
    let setting = await invoke("load_setting", { loadPath });
    return setting;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function saveSetting(setting: Setting, savePath?: string) {
  try {
    await invoke("save_setting", { setting, savePath });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function listProvide(): Promise<FileInfo[]> {
  try {
    let providers = await invoke<FileInfo[]>("list_provide");
    return providers;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function connectedPeers(): Promise<string[]> {
  try {
    let peers = await invoke<string[]>("connected_peers");
    return peers;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function dial(addr: string) {
  try {
    await invoke("dial", { addr });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function publishMessage(
  groupId: GroupId,
  message: Message
): Promise<void> {
  try {
    await invoke("publish_message", { groupId, message });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function subscribe(groupId: GroupId) {
  try {
    await invoke("subscribe", { groupId });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getGroups(): Promise<{ [index: GroupId]: GroupInfo }> {
  return await invoke<{ [index: GroupId]: GroupInfo }>("invoke_manager", {
    name: "group",
    action: "get_groups",
  });
}

export async function newGroup(groupInfo: GroupInfo): Promise<GroupId> {
  return await invoke<GroupId>("new_group", { groupInfo });
}

export async function getGroupState(groupId: GroupId): Promise<GroupState> {
  return await invoke<GroupState>("invoke_manager", {
    name: "group",
    action: "get_group_state",
    params: groupId,
  });
}

export async function getUsers(): Promise<{ [index: PeerId]: UserInfo }> {
  return await invoke<{ [index: PeerId]: UserInfo }>("invoke_manager", {
    name: "user",
    action: "get_users",
  });
}
