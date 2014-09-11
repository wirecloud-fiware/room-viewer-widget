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

  MashupPlatform.wiring.registerCallback('join_room',
    this.recv_data.bind(this));
};

RoomViewer.prototype = {

  constructor: RoomViewer,

  onOpen: function () {
    this.allow_recv = true;
  },

  onParticipantJoin: function (response) {
    this.receiveVideo(response.params.name);
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

  receiveVideo: function (sender) {
    var participant = new Participant(sender),
        video       = participant.getVideoElement();

    this.participants[sender] = participant;
    participant.rtcPeer = kwsUtils.WebRtcPeer.startRecvOnly(video,
        participant.offerToReceiveVideo.bind(participant));
    this.container.appendChild(participant.getElement());
  },

  recv_data: function (data) {
    var data = data.split(' ');

    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    this.participants = [];
    join_room(data[0], data[1]);
  },

  join_room: function (username, roomname) {
    client.sendRequest('joinRoom',
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

        console.log(username + ' registered in room ' + roomname);
        var participant = new Participant(username);
        participants[username] = participant;
        participant.rtcPeer = kwsUtils.WebRtcPeer.startSendOnly(
            participant.getVideoElement(), participant.offerToReceiveVideo.bind(participant), null, constraints);
        result.value.forEach(this.receiveVideo);
        MashupPlatform.wiring.pushEvent('participant', 'join_room');
      }.bind(this)
    );
  }

};
