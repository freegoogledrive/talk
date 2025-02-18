
const CLIENT_ID = 'Ww9KIEXUL5KzVED0';

const drone = new ScaleDrone(CLIENT_ID, {
  data: { // Will be sent out as clientData via events
    name: getRandomName(),
    color: getRandomColor(),
  },
});

let members = [];

drone.on('open', error => {
  if (error) {
    return console.error(error);
  }
  console.log('Successfully connected to Scaledrone');

  const room = drone.subscribe('observable-room');
  room.on('open', error => {
    if (error) {
      return console.error(error);
    }
    console.log('Successfully joined room');
  });

  room.on('members', m => {
    members = m;
    updateMembersDOM();
  });

  room.on('member_join', member => {
    members.push(member);
    updateMembersDOM();
  });

  room.on('member_leave', ({id}) => {
    const index = members.findIndex(member => member.id === id);
    members.splice(index, 1);
    updateMembersDOM();
  });
  
  room.on('data', (text, member) => {
     if (member) {
       
      addMessageToListDOM(text, member);
    } else {
      // Message is from server
    }
  });
});

drone.on('close', event => {
  console.log('Connection was closed', event);
});

drone.on('error', error => {
  console.error(error);
});

function getRandomName() {
  const adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green", "long", "late", "lingering", "bold", "little", "morning", "muddy", "old", "red", "rough", "still", "small", "sparkling", "throbbing", "shy", "wandering", "withered", "wild", "black", "young", "holy", "solitary", "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine", "polished", "ancient", "purple", "lively", "nameless"];
  const nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly", "feather", "grass", "haze", "mountain", "night", "pond", "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder", "violet", "water", "wildflower", "wave", "water", "resonance", "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper", "frog", "smoke", "star"];
  return (
    adjs[Math.floor(Math.random() * adjs.length)] +
    "_" +
    nouns[Math.floor(Math.random() * nouns.length)]
  );
}

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}

//------------- DOM STUFF

const DOM = {
  membersCount: document.querySelector('.members-count'),
  membersList: document.querySelector('.members-list'),
  messages: document.querySelector('.messages'),
  input: document.querySelector('.message-form__input'),
  form: document.querySelector('.message-form'),
};

DOM.form.addEventListener('submit', sendMessage);

function sendMessage(event) {
  event.preventDefault();

  const message = DOM.input.value;
  const fileInput = DOM.form.querySelector('.message-form__file');
  const file = fileInput.files[0];  // Get the selected file

  if (message === '' && !file) {
    return; // Don't send an empty message or without a file
  }

  if (message) {
    sendTextMessage(message);  // Send a text message
  }

  if (file) {
    sendImageMessage(file);  // Send an image message
  }

  DOM.input.value = '';  // Clear text input
  fileInput.value = '';   // Clear file input
}

function sendTextMessage(text) {
  drone.publish({
    room: 'observable-room',
    message: { type: 'text', content: text },
  });
}

function sendImageMessage(file) {
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64Image = reader.result;
    drone.publish({
      room: 'observable-room',
      message: { type: 'image', content: base64Image },
    });
  };
  reader.readAsDataURL(file);  // Convert the image to base64
}

function createMessageElement(text, member) {
  const el = document.createElement('div');
  const { name, color } = member.clientData;

  if (text.type === 'text') {
    el.className = 'message';
    el.appendChild(createMemberElement(member));
    el.appendChild(document.createTextNode(text.content));
  } else if (text.type === 'image') {
    const img = document.createElement('img');
    img.src = text.content;  // Set the base64 image source
    el.className = 'message image-message';
    el.appendChild(createMemberElement(member));
    el.appendChild(img);
  }

  return el;
}

function addMessageToListDOM(text, member) {
  const el = DOM.messages;
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.appendChild(createMessageElement(text, member));
  if (wasTop) {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}
