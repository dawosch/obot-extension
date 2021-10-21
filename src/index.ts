import $ from 'jquery';
import { getStorageByKey, removeStorageByKey, setStorageByKey } from './helper/ChromeApi';
import { Target, TargetStatusKey, TargetStatusValue } from './interfaces/Target';

let eventInterval: NodeJS.Timer;

// Add spy button to left navigation
$('ul#menuTable').append(
  $('<li><span class="menu_icon"><span class="menuImage"></span></span><a id="obot-spy-overview" class="menubutton" href="#""><span class="textlabel">Spy</span></a></li>').on(
    'click',
    '#obot-spy-overview',
    async () => {
      $('#obot-spy-content').html(await renderTable());
      $('#obot-spy-dialog').show();
      renderEventCount();
    }
  )
);

// Add spy dialog to body
$('body').append(renderSpyDialog());

// Add actions to spy dialog
$('#obot-spy-dialog').on('click', '#obot-close-btn', (e) => $(e.delegateTarget).hide());
$('#obot-spy-dialog').on('click', '#obot-clear-btn', async (e) => {
  if (confirm('Are you sure to clear the list?')) {
    await clearTargetList();
    $('#obot-spy-content').html(await renderTable());
  }
});
$('#obot-spy-dialog').on('click', '.obot-remove-btn', async (e) => {
  const targets = (await getStorageByKey('obot-stored_coordinates')) as Target[];
  // const coordinates = e.target.dataset['coordinates'] as string;
  const index = parseInt(e.target.dataset['index'] as string, 10);
  targets.splice(index, 1);

  await setStorageByKey('obot-stored_coordinates', targets);
  $('#obot-spy-content').html(await renderTable());
});

$('#obot-spy-dialog').on('click', '.obot-spy-btn', async (e) => {
  const coordinates = e.target.dataset['coordinates'] as string;
  const index = parseInt(e.target.dataset['index'] as string, 10);
  await sendSpyProbe(coordinates, '', index);

  renderEventCount();
});

$('#obot-spy-dialog').on('click', '#obot-target-name', async () => {
  await sortByPlayer();
  $('#obot-spy-content').html(await renderTable());
});

$('#obot-spy-dialog').on('click', '#obot-target-coords', async () => {
  await sortByCoords();
  $('#obot-spy-content').html(await renderTable());
});

$('#obot-spy-dialog').on('click', '#obot-target-scan', async () => {
  await sortByScan();
  $('#obot-spy-content').html(await renderTable());
});

$('#obot-spy-dialog').on('change', '#obot-spy-target-status', async (e) => {
  const index = e.target.dataset['index'];
  const targets = (await getStorageByKey('obot-stored_coordinates')) as Target[];
  targets[index].status = e.target.value;

  await setStorageByKey('obot-stored_coordinates', targets);

  $(`#obot-spy-player-${index}`).removeClass().addClass(e.target.value);
});

$('#obot-spy-dialog').on('drop', '#target-spy-table', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log(e);
});

$('#obot-spy-dialog').on('dragover', '#target-spy-table', async (e) => {
  e.preventDefault();
  e.stopPropagation();
});

function renderSpyDialog() {
  return `
    <dialog id="obot-spy-dialog">
      <div id="obot-spy-header">
        <button>X</button>
      </div>
      <div id="obot-spy-content"></div>
      <div id="obot-spy-footer">
        <div id="obot-spy-events"></div>
        <div id="obot-spy-actions">
          <button class="red-color" id="obot-clear-btn">Clear</button>
          <button id="obot-close-btn">Close</button>
        </div>
      </div>
    </dialog>
  `;
}

async function renderTable(): Promise<string> {
  return `
    <table id="target-spy-table" style="width: 100%">
      <thead>
        <tr>
          <td id="obot-target-id">#</td>
          <td id="obot-target-name">Player</td>
          <td id="obot-target-status">Status</td>
          <td id="obot-target-coords">Coordinates</td>
          <td id="obot-target-scan">Last scan</td>
          <td>Actions</td>
        </tr>
      </thead>
      <tbody>
        ${await renderTargets()}
      </tbody>
    </table>
  `;
}

async function renderTargets(): Promise<string> {
  const targets = (await getStorageByKey('obot-stored_coordinates')) as Target[];

  return targets
    .map(
      (target, i) => `
      <tr draggable="true">
        <td>${i + 1}</td>
        <td class="${target.status ? target.status : TargetStatusKey.Unknown}" id="obot-spy-player-${i}">${target.name}</td>
        <td>
          <select name="obot-spy-target-status" id="obot-spy-target-status" data-index="${i}">
            <option value="${TargetStatusKey.Inactive}" ${target.status === TargetStatusKey.Inactive ? 'selected' : ''}>${TargetStatusValue.Inactive}</option>
            <option value="${TargetStatusKey.Active}" ${target.status === TargetStatusKey.Active ? 'selected' : ''}>${TargetStatusValue.Active}</option>
            <option value="${TargetStatusKey.Honorable}" ${target.status === TargetStatusKey.Honorable ? 'selected' : ''}>${TargetStatusValue.Honorable}</option>
            <option value="${TargetStatusKey.Strong}" ${target.status === TargetStatusKey.Strong ? 'selected' : ''}>${TargetStatusValue.Strong}</option>
            <option value="${TargetStatusKey.Vacation}" ${target.status === TargetStatusKey.Vacation ? 'selected' : ''}>${TargetStatusValue.Vacation}</option>
            <option value="${TargetStatusKey.Unknown}" ${!target.status || target.status === TargetStatusKey.Unknown ? 'selected' : ''}>${TargetStatusValue.Unknown}</option>
          </select>
        </td>
        <td>${target.coordinates.join(':')}</td>
        <td>${new Date(target.lastscan).toLocaleString()}</td>
        <td>
          <button class="icon_nf icon_espionage obot-spy-btn" data-index="${i}" data-coordinates="${target.coordinates.join(':')}"></button>
          <button class="obot-remove-btn" style="background: url('${chrome.runtime.getURL(
            '/assets/RemoveSpy.png'
          )}');" data-index="${i}" data-coordinates="${target.coordinates.join(':')}"></button>
        </td>
      </tr>
    `
    )
    .join('');
}

async function sendSpyProbe(coordinates: string, token: string, index: number) {
  const split = coordinates.split(':');
  return new Promise<void>((resolve, reject) => {
    $.ajax({
      url: 'https://s180-de.ogame.gameforge.com/game/index.php?page=ingame&component=fleetdispatch&action=miniFleet&ajax=1&asJson=1',
      type: 'POST',
      dataType: 'json',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      data: `mission=6&galaxy=${split[0]}&system=${split[1]}&position=${split[2]}&type=1&shipCount=10&token=${token}`,
      success: async (res) => {
        if (res['response']['success'] === false && res['response']['message'] === 'Ein Fehler ist aufgetreten.') {
          const newToken = res['newToken'] as string;

          await sendSpyProbe(coordinates, newToken, index);
          resolve();
        } else if (res['response']['success'] === false) {
          const lastScanField = $(`#target-spy-table > tbody > tr:nth-of-type(${index + 1}) > td:nth-of-type(5)`);
          lastScanField.css('color', 'red');
          resolve();
        } else {
          const lastScanField = $(`#target-spy-table > tbody > tr:nth-of-type(${index + 1}) > td:nth-of-type(5)`);
          lastScanField.css('color', 'green');
          lastScanField.text(new Date().toLocaleString());

          updateSpyTarget(index);
          resolve();
        }
      },
    });
  });
}

async function updateSpyTarget(index: number) {
  const targets = (await getStorageByKey('obot-stored_coordinates')) as Target[];
  targets[index].lastscan = new Date().getTime();

  await setStorageByKey('obot-stored_coordinates', targets);
}

async function clearTargetList() {
  await removeStorageByKey('obot-stored_coordinates');
}

async function sortByPlayer() {
  const targets = (await getStorageByKey('obot-stored_coordinates')) as Target[];
  targets.sort((a, b) => a.name.localeCompare(b.name));

  await setStorageByKey('obot-stored_coordinates', targets);
}

async function sortByCoords() {
  const targets = (await getStorageByKey('obot-stored_coordinates')) as Target[];
  targets.sort((a, b) => {
    if (a.coordinates[0] < b.coordinates[0]) {
      return -1;
    }

    if (a.coordinates[0] > b.coordinates[0]) {
      return 1;
    }

    if (a.coordinates[1] < b.coordinates[1]) {
      return -1;
    }

    if (a.coordinates[1] > b.coordinates[1]) {
      return 1;
    }

    if (a.coordinates[2] < b.coordinates[2]) {
      return -1;
    }

    if (a.coordinates[2] > b.coordinates[2]) {
      return 1;
    }

    return 0;
  });

  await setStorageByKey('obot-stored_coordinates', targets);
}

async function sortByScan() {
  const targets = (await getStorageByKey('obot-stored_coordinates')) as Target[];
  targets.sort((a, b) => a.lastscan - b.lastscan);

  await setStorageByKey('obot-stored_coordinates', targets);
}

function renderEventCount() {
  if (eventInterval) {
    clearInterval(eventInterval);
  }

  $.getJSON('https://s180-de.ogame.gameforge.com/game/index.php?page=componentOnly&component=eventList&action=fetchEventBox&ajax=1&asJson=1', (res) => {
    const eventCount = parseInt(res['friendly'], 10);

    if (eventCount > 0) {
      const eventText = res['eventText'];
      let time = new Date(res['eventTime'] * 1000);

      eventInterval = setInterval(() => {
        time.setSeconds(time.getSeconds() - 1);
        if (time.getSeconds() === 0) {
          clearInterval(eventInterval);
          renderEventCount();
        } else if (eventCount === 0) {
          clearInterval(eventInterval);
        } else {
          $('#obot-spy-events').html('');
          $('#obot-spy-events').append(`Events: <span id="obot-spy-events">${eventCount}</span>`);
          $('#obot-spy-events').append(`Time: <span id="obot-spy-time">${time.toISOString().substr(11, 8)}</span>`);
          $('#obot-spy-events').append(` - <span id="obot-spy-time">${eventText}</span>`);
        }
      }, 1000);

      $('#obot-spy-events').html('');
      $('#obot-spy-events').append(`Events: <span id="obot-spy-events">${eventCount}</span>`);
      $('#obot-spy-events').append(`Time: <span id="obot-spy-time">${time.toISOString().substr(11, 8)}</span>`);
      $('#obot-spy-events').append(` - <span id="obot-spy-time">${eventText}</span>`);
    } else {
      $('#obot-spy-events').html('');
      $('#obot-spy-events').append(`Events: <span id="obot-spy-events">${eventCount}</span>`);
    }
  });
}
