import $ from 'jquery';
import { Coordinates, getStorageByKey, setStorageByKey } from './helper/ChromeApi';
import { containsCoordinates, startObservationForElement } from './helper/Generic';
import { Target } from './interfaces/Target';

startObservationForElement(async (m) => {
  const storedTargets = (await getStorageByKey('obot-stored_coordinates')) as Target[];
  const messages = $(m[0].target).find('#fleetsgenericpage > ul > li').toArray();

  for (const message of messages) {
    createSpyButton(message, storedTargets);
  }
});

async function createSpyButton(message: HTMLElement, storedTargets: Target[]) {
  try {
    const searchParams = new URL($(message).find('div.msg_head > span.msg_title.blue_txt a').attr('href')!.toString()).searchParams;
    const coordinates = [searchParams.get('galaxy'), searchParams.get('system'), searchParams.get('position')].map((coord) => parseInt(coord!, 10));
    let player = $(message).find('span > div:nth-child(3) > span:nth-child(2)').text().trim();
    if (!player) {
      player = $(message).find('div.combatRightSide > span:nth-of-type(1)').text().split(':')[1].trim().replace('(', '').replace(')', '');
    }
    const datetime = $(message).find('div.msg_head > span.fright > span').text().trim();

    const datesplit = datetime.split(' ')[0].split('.');
    const timesplit = datetime.split(' ')[1];

    const date = new Date(`${datesplit[2]}/${datesplit[1]}/${datesplit[0]} ${timesplit}`);

    const target: Target = { name: player, coordinates, lastscan: date.getTime() };
    const coordinatesStored = containsCoordinates(storedTargets, coordinates);
    const span = $('<span></span>');
    span.addClass('icon_nf');
    span.css({
      background: coordinatesStored ? `url("${chrome.runtime.getURL('/assets/RemoveSpy.png')}` : `url("${chrome.runtime.getURL('/assets/AddSpy.png')}`,
    });

    const button = $('<a href="#"></a>');
    button.addClass('icon_nf_link');
    button.css({ margin: '0 7px', width: '26px', height: '26px' });

    button.on('click', async (e) => {
      e.preventDefault();

      if (coordinatesStored) {
        await removePlayerCoordinates(target);
        span.css({ background: `url("${chrome.runtime.getURL('/assets/AddSpy.png')}` });
      } else {
        await addPlayerCoordinates(target);
        span.css({ background: `url("${chrome.runtime.getURL('/assets/RemoveSpy.png')}` });
      }
    });

    button.append(span);

    $(message).children('.msg_actions').append(button);
  } catch {}
}

// const navInterval = setInterval(() => {
//   const navbar = $('#fleetsTab ul a');

//   if (navbar.length !== 0) {
//     clearInterval(navInterval);

//     navbar.on('click', (e) => {
//       e.preventDefault();
//       console.log('Click');

//       const interval = setInterval(async () => {
//         const messages = $('#fleetsgenericpage > ul > li').toArray();
//         if (messages.length !== 0) {
//           clearInterval(interval);

//           // chrome.storage.sync.clear();

//           const storedTargets = (await getStorageByKey('obot-stored_coordinates')) as Target[];

//           for (const message of messages) {
//             const searchParams = new URL($(message).find('div.msg_head > span.msg_title.blue_txt > a').attr('href')!.toString()).searchParams;
//             const coordinates = [searchParams.get('galaxy'), searchParams.get('system'), searchParams.get('position')].map((coord) => parseInt(coord!, 10));
//             const player = $(message).find('span > div:nth-child(3) > span:nth-child(2)').text().trim();
//             const datetime = $(message).find('div.msg_head > span.fright > span').text().trim();

//             const datesplit = datetime.split(' ')[0].split('.');
//             const timesplit = datetime.split(' ')[1];

//             const date = new Date(`${datesplit[2]}/${datesplit[1]}/${datesplit[0]} ${timesplit}`);

//             const target: Target = { name: player, coordinates, lastscan: date.getTime() };

//             const coordinatesStored = containsCoordinates(storedTargets, coordinates);

//             const span = $('<span></span>');
//             span.addClass('icon_nf');
//             span.css({
//               background: coordinatesStored ? `url("${chrome.runtime.getURL('/assets/RemoveSpy.png')}` : `url("${chrome.runtime.getURL('/assets/AddSpy.png')}`,
//             });

//             const button = $('<a href="#"></a>');
//             button.addClass('icon_nf_link');
//             button.css({ margin: '0 7px', width: '26px', height: '26px' });

//             button.on('click', async (e) => {
//               e.preventDefault();

//               if (coordinatesStored) {
//                 await removePlayerCoordinates(target);
//                 span.css({ background: `url("${chrome.runtime.getURL('/assets/AddSpy.png')}` });
//               } else {
//                 await addPlayerCoordinates(target);
//                 span.css({ background: `url("${chrome.runtime.getURL('/assets/RemoveSpy.png')}` });
//               }
//             });

//             button.append(span);

//             $(message).children('.msg_actions').append(button);
//           }
//         }
//       }, 100);
//     });
//   }
// }, 100);

async function addPlayerCoordinates(target: Target) {
  const targets: Target[] = (await getStorageByKey('obot-stored_coordinates')) as Target[];
  await setStorageByKey('obot-stored_coordinates', targets ? [...targets, target] : [target]);
}

async function removePlayerCoordinates(target: Target) {
  const targets: Target[] = (await getStorageByKey('obot-stored_coordinates')) as Target[];

  for (let i = 0; i < targets.length; i++) {
    if (targets[i].coordinates[0] === target.coordinates[0] && targets[i].coordinates[1] === target.coordinates[1] && targets[i].coordinates[2] === target.coordinates[2]) {
      targets.splice(i, 1);
      await setStorageByKey('obot-stored_coordinates', targets);
    }
  }
}
