/**
 * @file room-viewer.js
 * @version 0.0.1
 * 
 * @copyright 2014 CoNWeT Lab., Universidad Politécnica de Madrid
 * @license Apache v2 (https://github.com/Wirecloud/room-viewer-widget/blob/master/LICENSE)
 */


/**
 * Create a new instance of RoomViewer.
 * 
 * @class
 */
var RoomViewer = function () {
  var url = 'ws://130.206.81.33:8080/call';

  this.ws = new WebSocket(url);
  this.ws.onmessage = function (message) {
    var parsedMessage = JSON.parse(message.data);
    console.info('Received message: ' + message.data);

    switch (parsedMessage.id) {
      case 'joinRoomResponse':
        var constraints = {
            audio : true,
            video : {
                mandatory: {
                    maxWidth     : 320,
                    maxFrameRate : 15,
                    minFrameRate : 15
                }
            }
        };
        while (this.container.firstChild) {
          this.container.removeChild(this.container.firstChild);
        }
        this.participants = parsedMessage.params.participants; 
        this.hideInfoAlert();

        console.log(parsedMessage.response);
        var participant = new Participant(this.username, this.ws);
        this.participants[this.username] = participant;
        participant.rtcPeer = kurentoUtils.WebRtcPeer.startSendOnly(
            participant.getVideoElement(), function (offerSdp) {
              console.log('Invoking SDP offer callback function');
              var message = {
                id: 'receiveVideoFrom',
                params: {
                  sender: participant.username,
                  receiver: this.username,
                  sdpOffer: offerSdp
                }
              };
              this.ws.sendMessage(message);
            }, null, constraints);
        
        result.value.forEach(this.create_participant_video.bind(this));
        
        this.container.appendChild(participant.getElement());
        MashupPlatform.wiring.pushEvent('participant', 'join_room');
        break;
      case 'leaveRoomResponse':
        MashupPlatform.wiring.pushEvent('participant', 'left_room');
        MashupPlatform.wiring.pushEvent('terminate_stream', '');
        console.log(parsedMessage.response);
        break;
      case 'receiveVideoResponse':
        var participant = this.participants[parsedMessage.params.sender];
        participant.rtcPeer.processSdpAnswer(parsedMessage.params.sdpAnswer);
        break;
      case 'error':
        console.error(parsedMessage.message);
        break;
      default:
    }
  };

  this.ws.sendMessage = function (message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Senging message: ' + jsonMessage);
    ws.send(jsonMessage);
  }

  this.ws.onopen = function () {
    this.allow_recv = true;
  };

  window.onbeforeunload = function() {
    ws.close();
  };

  this.allow_recv   = false;
  this.exists_prev_room = false;

  this.container = document.getElementById('participant-list');
  this.participants = [];
  this.showInfoAlert();
  this.username = MashupPlatform.context.get('username');
  this.roomName = MashupPlatform.mashup.context.get('name');;

  this.join_room(this.username, this.roomName);

  var leave = document.getElementById('leave');

  leave.addEventListener('click', this.leave_room.bind(this), true);
  MashupPlatform.wiring.registerCallback('join_room',
    this.recv_data.bind(this));
};

RoomViewer.prototype = {

  constructor: RoomViewer,

  
  onParticipantJoin: function (response) {
    this.create_participant_video(response.params.name);
    MashupPlatform.wiring.pushEvent('participant', 'join_room');
  },

  onParticipantLeft: function (response) {
    console.log('Participant ' + response.params.name + ' left');
    var participant = this.participants[response.params.name];
    participant.dispose();
    delete this.participants[response.params.name];
    MashupPlatform.wiring.pushEvent('participant', 'left_room');
  },

  receiveVideo: function (participant) {
    var video = participant.getVideoElement();

    participant.rtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(video,
        function (sdpOffer) {
          console.log('Invoking SDP offer callback function');
          var message = {
            id: 'receiveVideoFrom',
            params: {
              sender: participant.username,
              receiver: this.username,
              sdpOffer: offerSdp
            }
          };
          this.ws.sendMessage(message);
        });
    this.container.appendChild(participant.getElement());
  },

  recv_data: function (data) {

    if (this.exists_prev_room) {
      this.leave_room();
    }

    var data = data.split(' ');
    this.exists_prev_room = true;
    this.update_roomname(data[1]);
    this.join_room(data[0], data[1]);
  },

  join_room: function (username, roomName) {
    var message = {
      id: 'joinRoom',
      params: {
        username: username,
        roomName: roomName
      }
    };
    this.ws.sendMessage(message);
  },

  update_roomname: function (roomname) {
    var room = document.getElementById('name');
    room.textContent = roomname;
  },

  add_participant: function (participant_name) {
    var participant = new Participant(participant_name, this.ws);
    this.participants[participant_name] = participant;

    return participant;
  },

  leave_room: function () {
    if (!this.exists_prev_room) {
      return;
    };
    console.log('Participant ' + this.username + ' left the room');
    var participant = this.participants[this.username];
    participant.dispose(this.roomName);
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.participants = [];
    this.showInfoAlert();
    this.update_roomname('');
    this.exists_prev_room = false;
  },

  showInfoAlert: function () {
    var alert   = document.createElement('div'),
        message = "The viewer is not connected to any room.";

    alert.className = 'alert alert-info text-center';
    alert.innerHTML = '<span class="fa fa-info-circle"></span> ' + message;
    document.body.insertBefore(alert, this.container);
  },

  hideInfoAlert: function () {

    var alert = document.querySelector('.alert');

    if (!alert) {
      return;
    }

    document.body.removeChild(alert);
  },

  create_participant_video: function (participant_name) {
    var participant = this.add_participant(participant_name);
    this.receiveVideo(participant);
  }

};
