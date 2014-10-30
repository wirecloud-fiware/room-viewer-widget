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
  var url = 'ws://130.206.81.33:8081/call';

  this.ws = new WebSocket(url);
  
  this.ws.onmessage = function (message) {
    var parsedMessage = JSON.parse(message.data);
    console.info('Received message: ' + message.data);

    switch (parsedMessage.id) {

      case 'joinRoomResponse':

        if (parsedMessage.params.sdpAnswer) {
          this.participants[this.username].rtcPeer.processSdpAnswer(parsedMessage.params.sdpAnswer);
        }
        
        while (this.container.hasChildNodes()) {
          this.container.removeChild(this.container.firstChild);
        }
        this.hideInfoAlert();
        var receivedParticipants = parsedMessage.params.participants;
        console.log(parsedMessage.response);
        console.log('Participants: ' + parsedMessage.params.participants);
        
        for (var i = 0; i < receivedParticipants.length; i++) {
          this.create_participant_video(receivedParticipants[i]);
        }
        
        this.exists_prev_room = true;
        this.update_roomname(this.roomName);
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

      case 'participantJoin':
        this.onParticipantJoin(parsedMessage.params.participantName);
        break;

      case 'participantLeft':
        this.onParticipantLeft(parsedMessage.params.participantName);
        break;

      case 'error':
        console.error(parsedMessage.message);
        break;

      default:
    }
  }.bind(this);

  this.ws.sendMessage = function (message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    this.send(jsonMessage);
  };

  window.onbeforeunload = function() {
    this.ws.close();
  };

  this.exists_prev_room = false;

  this.container = document.getElementById('participant-list');
  this.participants = [];
  this.showInfoAlert();
  this.username = MashupPlatform.context.get('username');
  this.roomName = MashupPlatform.mashup.context.get('name');

  var leave = document.getElementById('leave');
  var create = document.getElementById('create-room');

  create.addEventListener('click', this.join_room.bind(this), true);
  leave.addEventListener('click', this.leave_room.bind(this), true);
  MashupPlatform.wiring.registerCallback('join_room',
    this.recv_data.bind(this));
};

RoomViewer.prototype = {

  constructor: RoomViewer,

  
  onParticipantJoin: function (participantName) {
    this.create_participant_video(participantName);
    console.log('Participant ' + participantName + ' joined');
    MashupPlatform.wiring.pushEvent('participant', 'join_room');
  },

  onParticipantLeft: function (participantName) {
    var participant = this.participants[participantName];
    participant.dispose();
    delete this.participants[participantName];
    participant.getElement().remove();
    console.log('Participant ' + participantName + ' left');
    MashupPlatform.wiring.pushEvent('participant', 'left_room');
  },

  receiveVideo: function (participant) {
    var video = participant.getVideoElement();
    if (participant.username === this.username){
      return;
    }
    participant.rtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(video,
        function (offerSdp) {
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
        }.bind(this));
  },

  recv_data: function (data) {

    if (this.exists_prev_room) {
      this.leave_room();
    }

    var data = data.split(' ');
    this.join_room();
  },

  join_room: function () {

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

    var participant = new Participant(this.username, this.ws);
    this.participants[this.username] = participant;

    participant.rtcPeer = kurentoUtils.WebRtcPeer.startSendOnly(
      participant.getVideoElement(), function (offerSdp) {
        console.log('Invoking SDP offer callback function');
        var message = {
          id: 'joinRoom',
          params: {
            username: participant.username,
            roomName: this.roomName,
            sdpOffer: offerSdp
          }
        };
        this.ws.sendMessage(message);
      }.bind(this), function (error) {
        console.log(error);
        var message = {
          id: 'joinRoom',
          params: {
            username: participant.username,
            roomName: this.roomName
          }
        };
        this.ws.sendMessage(message);
      }.bind(this), constraints);
  },

  update_roomname: function (name) {
    name = name || '';
    var room = document.getElementById('name');
    room.textContent = name;
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
    participant.dispose();
    var message = {
      id: 'leaveRoom',
      params: {
        participantName: this.username,
        roomName: this.roomName
      }
    };

    this.ws.sendMessage(message);
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.participants = [];
    this.showInfoAlert();
    this.update_roomname();
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
    var participant;
    if (!this.participants[participant_name]) {
      participant = this.add_participant(participant_name);
    }
    else {
      participant = this.participants[participant_name];
    }
    console.log('Sender: ' + participant.username);
    this.receiveVideo(participant);
    this.container.appendChild(participant.getElement());
  },

};
