import $ from 'jquery';
import { getStorageByKey, removeStorageByKey, setStorageByKey } from './helper/ChromeApi';
import { Target } from './interfaces/Target';

// Add spy button to left navigation
$('ul#menuTable').append(
  $('<li><span class="menu_icon"><span class="menuImage"></span></span><a id="obot-spy-overview" class="menubutton" href="#""><span class="textlabel">Spy</span></a></li>').on(
    'click',
    '#obot-spy-overview',
    async () => {
      $('#obot-spy-content').html(await renderTable());
      $('#obot-spy-dialog').show();
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

$('#obot-spy-dialog').on('click', '.obot-spy-btn', (e) => {
  const coordinates = e.target.dataset['coordinates'] as string;
  const index = parseInt(e.target.dataset['index'] as string, 10);

  sendSpyProbe(coordinates, '', index);
});

function renderSpyDialog() {
  return `
    <dialog id="obot-spy-dialog">
      <div id="obot-spy-content"></div>
      <div id="obot-spy-actions">
        <button class="red-color" id="obot-clear-btn">Clear</button>
        <button id="obot-close-btn">Close</button>
      </div>
    </dialog>
  `;
}

async function renderTable(): Promise<string> {
  return `
    <table id="target-spy-table" style="width: 100%">
      <thead>
        <tr>
          <td>#</td>
          <td>Player</td>
          <td>Coordinates</td>
          <td>Last scan</td>
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
      <tr>
        <td>${i + 1}</td>
        <td>${target.name}</td>
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

function sendSpyProbe(coordinates: string, token: string, index: number) {
  const split = coordinates.split(':');

  $.ajax({
    url: 'https://s180-de.ogame.gameforge.com/game/index.php?page=ingame&component=fleetdispatch&action=miniFleet&ajax=1&asJson=1',
    type: 'POST',
    dataType: 'json',
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    data: `mission=6&galaxy=${split[0]}&system=${split[1]}&position=${split[2]}&type=1&shipCount=10&token=${token}`,
    success: (res) => {
      if (res['response']['success'] === false) {
        const newToken = res['newToken'] as string;

        sendSpyProbe(coordinates, newToken, index);
      } else {
        const lastScanField = $(`#target-spy-table > tbody > tr:nth-of-type(${index + 1}) > td:nth-of-type(3)`);
        lastScanField.css('color', 'green');
        lastScanField.text(new Date().toLocaleString());

        updateSpyTarget(index);
      }
    },
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
