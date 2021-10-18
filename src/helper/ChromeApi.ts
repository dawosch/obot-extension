export type Coordinates = number[];

export async function getStorageByKey(key: string) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get([key], (result) => {
        if (result[key]) {
          resolve(result[key]);
        } else {
          resolve([]);
        }
      });
    } catch (e) {
      resolve([]);
    }
  });
}

export async function setStorageByKey(key: string, value: any) {
  return new Promise<void>((resolve, reject) => {
    chrome.storage.sync.set({ [key]: value }, () => resolve());
  });
}

export async function removeStorageByKey(key: string) {
  return new Promise<void>((resolve, reject) => {
    chrome.storage.sync.set({ [key]: [] }, () => resolve());
  });
}
