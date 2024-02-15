// script.js
// Constants to easily refer to pages
const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");

// Custom validation on the password reset fields
const passwordField = document.querySelector(".profile input[name=password]");
const repeatPasswordField = document.querySelector(".profile input[name=repeatPassword]");
const repeatPasswordMatches = () => {
  const p = document.querySelector(".profile input[name=password]").value;
  const r = repeatPassword.value;
  return p == r;
};

const checkPasswordRepeat = () => {
  const passwordField = document.querySelector(".profile input[name=password]");
  if(passwordField.value == repeatPasswordField.value) {
    repeatPasswordField.setCustomValidity("");
    return;
  } else {
    repeatPasswordField.setCustomValidity("Password doesn't match");
  }
}

passwordField.addEventListener("input", checkPasswordRepeat);
repeatPasswordField.addEventListener("input", checkPasswordRepeat);


function redirectTo(path) {
  const stateObject = { path: path };
  history.pushState(stateObject, '', path);
  window.dispatchEvent(new Event('popstate'));
}

function redirectHandler() {
  const path = window.location.pathname;
  if (!path.startsWith('/room')) {
    stopMessagePolling();
  }
  const showSection = (section) => {
    section.style.display = 'block';
  };
  SPLASH.style.display = 'none';
  PROFILE.style.display = 'none';
  LOGIN.style.display = 'none';
  ROOM.style.display = 'none';
  if (path === '/') {
    showSection(SPLASH);
  } else if (path === '/login') {
    showSection(LOGIN);
  } else if (path === '/profile') {
    showSection(PROFILE);
  } else if (path.startsWith('/room')) {
    const roomId = path.split('/room/')[1];
    showRoom(roomId);
  } else {
    ROOM.style.display = 'none';
    stopMessagePolling();
  }
}

window.addEventListener('DOMContentLoaded', (event) => {
  updateUsernameDisplay();
  fetchAndDisplayRooms();
  stopMessagePolling()
  const signupButton = document.querySelector(".signup");
  if (signupButton) {
    signupButton.addEventListener('click', function() {
      redirectTo('/login');
    });
  }
  const loginLink = document.querySelector(".loggedOut a");
  if (loginLink) {
    loginLink.addEventListener('click', function(event) {
      event.preventDefault();
      redirectTo('/login');
    });
  }
  const profileLink = document.querySelector(".loggedIn a");
  if (profileLink) {
    profileLink.addEventListener('click', function(event) {
      event.preventDefault();
      redirectTo('/profile');
    });
  }
  const createRoomButton = document.querySelector(".create");
  if (createRoomButton) {
    createRoomButton.addEventListener('click', function() {
      const roomName = prompt("Please enter the room name:");
      if (roomName) {
        createRoom(roomName);
      }
    });
  }
  const loginnButton = document.querySelector(".loginbutton");
  if (loginnButton) {
    loginnButton.addEventListener('click', function() {
      event.preventDefault();
      const username = document.querySelector(".login input[name='username']").value;
      const password = document.querySelector(".login input[name='password']").value;
      if (!username || !password) {
        alert('Please enter both username and password.');
        return;
      }
      login(username, password);
    });
  }
  const createAccountButton = document.querySelector(".createAccount");
  createAccountButton.addEventListener('click', function(event) {
      event.preventDefault();
      signup()
  });
  const coolButton = document.querySelector(".exit.goToSplash");
  if (coolButton) {
    coolButton.addEventListener('click', function(event) {
      event.preventDefault();
      redirectTo('/');
    });
  }
  const logoutButton = document.querySelector(".exit.logout");
  if (logoutButton) {
    logoutButton.addEventListener('click', function(event) {
      event.preventDefault();
      logout();
    });
  }
  const updateUsernameButton = document.querySelector("#updateUsernameButton");
  if (updateUsernameButton) {
    updateUsernameButton.addEventListener('click', function(event) {
      event.preventDefault();
      const newUsername = document.querySelector("#new_username").value;
      const apiKey = localStorage.getItem('apiKey');
      if (!newUsername) {
        alert('Please enter the new username.');
        return;
      }
      updateUsername(apiKey, newUsername);
    });
  }
  const updatePasswordButton = document.querySelector("#updatePasswordButton");
  if (updatePasswordButton) {
    updatePasswordButton.addEventListener('click', function(event) {
      event.preventDefault();
      const newPassword = document.querySelector("#new_password").value;
      const confirmPassword = document.querySelector("#repeatPassword").value;
      const apiKey = localStorage.getItem('apiKey');
      if (!newPassword || !confirmPassword) {
        alert('Please enter and confirm the new password.');
        return;
      }
      if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
      updatePassword(apiKey, newPassword, confirmPassword);
    });
  }
  const usernameElements = document.querySelectorAll('.loggedIn .home');
  usernameElements.forEach(element => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      redirectTo('/');
    });
  });
});

window.addEventListener('DOMContentLoaded', redirectHandler);
window.addEventListener('popstate', redirectHandler);


function signup() {
  fetch('/api/signup', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
  })
  .then(response => response.json())
  .then(data => {
      if(data.success) {
          localStorage.setItem('apiKey', data.api_key);
          localStorage.setItem('userName', data.user_name);
          localStorage.setItem('userId', data.user_id);
          console.log("user data:", data);
          updateUsernameDisplay();
          redirectTo('/');
      } else {
          console.error('User creation failed:', data.error);
      }
  })
  .catch((error) => {
      console.error('Error:', error);
  });
  }

function login(username, password) {
  document.getElementById('loginFailedMessage').style.display = 'none';
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username,
      password: password
    })
  })
  .then(response => response.json())
  .then(data => {
    if(data.success) {
      localStorage.setItem('apiKey', data.api_key);
      localStorage.setItem('userName', data.username);
      localStorage.setItem('userId', data.userid);
      console.log("log in local storage:", localStorage);
      updateUsernameDisplay();
      redirectTo('/');
    } else {
      document.getElementById('loginFailedMessage').style.display = 'block';
    }
  })
  .catch((error) => {
    console.error('Error:', error);
    document.getElementById('loginFailedMessage').style.display = 'block';
  });
}

function logout() {
  localStorage.removeItem('apiKey');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  console.log("log out local storage:", localStorage);
  redirectTo('/login');
}

function updateUsername(apiKey, newUsername) {
  const API_Key = localStorage.getItem('apiKey');
  fetch('/api/update_username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-key': API_Key
    },
    body: JSON.stringify({
      api_key: apiKey,
      new_name: newUsername
    })
  })
  .then(response => response.json())
  .then(data => {
    if(data.success) {
      console.log("Username updated successfully");
      localStorage.setItem('userName', newUsername);
      alert('Username updated successfully.');
      updateUsernameDisplay();
    } else {
      console.error('Update failed:', data.message);
      alert('Failed to update username.');
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

function updatePassword(apiKey, newPassword, confirmPassword) {
  const API_Key = localStorage.getItem('apiKey');
  fetch('/api/update_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-key': API_Key
    },
    body: JSON.stringify({
      api_key: apiKey,
      new_password: newPassword,
      confirm_password: confirmPassword
    })
  })
  .then(response => response.json())
  .then(data => {
    if(data.success) {
      console.log("Password updated successfully");
      alert('Password updated successfully.');
    } else {
      console.error('Update failed:', data.message);
      alert('Failed to update password.');
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

function updateUsernameDisplay() {
  const storedUsername = localStorage.getItem('userName');
  const usernameDisplayElements = document.querySelectorAll('.username');
  usernameDisplayElements.forEach(element => {
    element.textContent = storedUsername || 'Guest';
  });
}

function fetchAndDisplayRooms() {
  fetch('/api/rooms', {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success !== false) {
      const roomList = document.querySelector('.roomList');
      roomList.innerHTML = '';
      data.forEach(room => {
        const roomElement = document.createElement('a');
        roomElement.textContent = `${room.id}: ${room.name}`;
        roomElement.href = `#/room/${room.id}`;
        roomElement.addEventListener('click', function(event) {
          event.preventDefault();
          redirectTo(`/room/${room.id}`);
        });
        roomList.appendChild(roomElement);
      });
      const noRooms = document.querySelector('.noRooms');
      if (data.length > 0) {
        noRooms.style.display = 'none';
      } else {
        noRooms.style.display = 'block';
      }
    } else {
      console.error('Failed to fetch rooms:', data.message);
    }
  })
  .catch(error => {
    console.error('Error fetching rooms:', error);
  });
}

function createRoom(roomName) {
  const API_Key = localStorage.getItem('apiKey');

  fetch('/api/create_room', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-key': API_Key
    },
    body: JSON.stringify({
      room_name: roomName
    })
  })
  .then(response => response.json())
  .then(data => {
    if(data.success) {
      console.log("Room created successfully:", data.room);
      // Optionally, refresh the list of rooms
      fetchAndDisplayRooms();
    } else {
      console.error('Room creation failed:', data.message);
      alert('Failed to create room.');
    }
  })
  .catch((error) => {
    console.error('Error creating room:', error);
    alert('Error creating room.');
  });
}

function showRoom(roomId) {
  localStorage.setItem('currentRoomID', roomId);
  fetch(`/api/room/${roomId}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    if(data.success !== false) {
      const roomNameDisplay = document.querySelector('.displayRoomName strong');
      roomNameDisplay.textContent = data.name;
      const inviteLink = document.getElementById('inviteLink');
      inviteLink.href = `/rooms/${roomId}`;
      inviteLink.textContent = `/rooms/${roomId}`;
      ROOM.style.display = 'block';
      SPLASH.style.display = 'none';
      PROFILE.style.display = 'none';
      LOGIN.style.display = 'none';
      startMessagePolling();
    } else {
      console.error('Failed to fetch room details:', data.message);
    }
  })
  .catch(error => {
    console.error('Error fetching room details:', error);
  });
}

function getMessages() {
  const room_id = localStorage.getItem('currentRoomID');
  fetch(`/api/rooms/${room_id}/messages`)
    .then(response => response.json())
    .then(messages => {
      const messagesContainer = document.querySelector('.messages');
      messagesContainer.innerHTML = '';
      messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        const authorElement = document.createElement('div');
        authorElement.classList.add('author');
        authorElement.textContent = `${message.author}: `;
        const bodyElement = document.createElement('div');
        bodyElement.classList.add('body');
        bodyElement.textContent = message.body;
        messageElement.appendChild(authorElement);
        messageElement.appendChild(bodyElement);
        messagesContainer.appendChild(messageElement);
      });
    })
    .catch(error => console.error('Error fetching messages:', error));
}

let messagePollingInterval = null;

function startMessagePolling() {
  getMessages();
  messagePollingInterval = setInterval(getMessages, 500);
}

function stopMessagePolling() {
  if (messagePollingInterval !== null) {
    clearInterval(messagePollingInterval);
    messagePollingInterval = null;
  }
}

function postMessage() {
  const room_id = localStorage.getItem('currentRoomID');
  const userid = localStorage.getItem('userId');
  const messageBody = document.getElementById('messageInput').value;
  if (messageBody.trim().length === 0) {
    alert("Please enter a message.");
    return;
  }
  const API_Key = localStorage.getItem('apiKey');
  fetch(`/api/rooms/${room_id}/messages/post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-key': API_Key
    },
    body: JSON.stringify({ userid: userid, body: messageBody }),
  })
  .then(response => {
    if (response.ok) {
      console.log('Message posted successfully');
      document.getElementById('messageInput').value = '';
      getMessages();
    } else {
      console.error('Failed to post message');
      response.json().then(data => {
        if (data && typeof data === 'object' && data.error) {
          console.error('Error:', data.error);
        } else {
          console.error('Error: Unknown error from server');
        }
      }).catch(error => console.error('Error parsing error response:', error));
    }
  })
  .catch(error => console.error('Error posting message:', error));
}

function updateRoomName() {
  const roomId = localStorage.getItem('currentRoomID');
  const newName = document.querySelector('.editRoomName input').value;
  const API_Key = localStorage.getItem('apiKey');
  fetch(`/api/room/${roomId}/update_name`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'API-key': API_Key
      },
      body: JSON.stringify({ new_name: newName }),
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          alert('Room name updated successfully');
          document.querySelector('.displayRoomName strong').textContent = newName;
          toggleEditRoomNameVisibility();
      } else {
          alert('Failed to update room name: ' + data.message);
      }
  })
  .catch(error => {
      console.error('Error updating room name:', error);
      alert('Error updating room name.');
  });
}
document.querySelector('.editRoomName button').addEventListener('click', updateRoomName);


function toggleEditRoomNameVisibility() {
  const editRoomDiv = document.querySelector('.editRoomName');
  if (editRoomDiv.style.display === 'none' || !editRoomDiv.style.display) {
      editRoomDiv.style.display = 'block';
  } else {
      editRoomDiv.style.display = 'none';
  }
}

document.querySelectorAll('.edit-icon').forEach(icon => {
  icon.addEventListener('click', toggleEditRoomNameVisibility);
});
