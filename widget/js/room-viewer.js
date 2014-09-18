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
  var url = 'ws://130.206.81.33:8080/groupcall/ws/websocket';

  this.client = new RpcBuilder.clients.JsonRpcClient(url,
    this.onRequest.bind(this), this.onOpen.bind(this));

  this.container = document.getElementById('participant-list');
  this.participants = [];
  this.allow_recv   = false;
  this.username = MashupPlatform.context.get('username');
  this.exists_prev_room = false;

  var leave = document.getElementById('leave');

  leave.addEventListener('click', this.leave_room.bind(this), true);
  MashupPlatform.wiring.registerCallback('join_room',
    this.recv_data.bind(this));
};

RoomViewer.prototype = {

  constructor: RoomViewer,

  onOpen: function () {
    this.allow_recv = true;
  },

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

  onRequest: function (response) {
    switch (response.method) {
      case 'newParticipantArrived':
        this.onParticipantJoin(response);
        break;
      case 'participantLeft':
        this.onParticipantLeft(response);
        break;
      default:
        console.error('Method not recognized.');
    }
  },

  receiveVideo: function (participant) {
    var video = participant.getVideoElement();

    participant.rtcPeer = kwsUtils.WebRtcPeer.startRecvOnly(video,
        participant.offerToReceiveVideo.bind(participant));
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

  join_room: function (username, roomname) {
    this.client.sendRequest('joinRoom',
      {name : username, room : roomname},
      function (error, result) { 
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
        this.participants = []; 

        console.log(username + ' registered in room ' + roomname);
        var participant = new Participant(username, this.client);
        this.participants[username] = participant;
        participant.rtcPeer = kwsUtils.WebRtcPeer.startSendOnly(
            participant.getVideoElement(), participant.offerToReceiveVideo.bind(participant), null, constraints);
        
        result.value.forEach(this.create_participant_video.bind(this));
        
        this.container.appendChild(participant.getElement());
        MashupPlatform.wiring.pushEvent('participant', 'join_room');
      }.bind(this)
    );
  },

  update_roomname: function (roomname) {
    var room = document.getElementById('name');
    room.textContent = roomname;
  },

  add_participant: function (participant_name) {
    var participant = new Participant(participant_name, this.client);
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
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.participants = [];
    this.update_roomname('');
    this.exists_prev_room = false;
  },

  create_participant_video: function (participant_name) {
    var participant = this.add_participant(participant_name);
    this.receiveVideo(participant);
  }

};
