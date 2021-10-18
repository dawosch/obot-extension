import { Target } from '../interfaces/Target';
import { Coordinates } from './ChromeApi';

export function compareCoordinates(coords1: Coordinates, coords2: Coordinates): boolean {
  return coords1[0] === coords2[0] && coords1[1] === coords2[1] && coords1[2] === coords2[2];
}

export function containsCoordinates(targets: Target[], coords: Coordinates): boolean {
  for (const target of targets) {
    if (target.coordinates[0] === coords[0] && target.coordinates[1] === coords[1] && target.coordinates[2] === coords[2]) {
      return true;
    }
  }
  return false;
}

export function startObservationForElement(callback: MutationCallback) {
  const observer = new MutationObserver((m) => {
    observer.disconnect();

    const childObserver = new MutationObserver(callback);
    childObserver.observe(document.querySelector(`#ui-id-2 > #fleetsTab > div > div > div:nth-of-type(1)`)!, { childList: true });
    childObserver.observe(document.querySelector(`#ui-id-2 > #fleetsTab > div > div > div:nth-of-type(2)`)!, { childList: true });
    // childObserver.observe(document.querySelector(`#ui-id-2 > #fleetsTab > div > div > div:nth-of-type(3)`)!, { childList: true });
    // childObserver.observe(document.querySelector(`#ui-id-2 > #fleetsTab > div > div > div:nth-of-type(4)`)!, { childList: true });
    // childObserver.observe(document.querySelector(`#ui-id-2 > #fleetsTab > div > div > div:nth-of-type(5)`)!, { childList: true });
  });

  observer.observe(document.querySelector('#ui-id-2')!, { childList: true });
}
