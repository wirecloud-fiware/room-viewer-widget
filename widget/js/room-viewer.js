var server_URL = 'ws://130.206.81.33:8080/groupcall/ws/websocket';
var client = new RpcBuilder.clients.JsonRpcClient(server_URL, onRequest, onopen);
var room_name, username;
var participants = [];
var allow_recv = false;


function onRequest(message) {

        if (message.method === "newParticipantArrived") {
            onParticipantJoin(message);
        } else if (message.method === "participantLeft") {
            onParticipantLeft(message);
        } else {
            console.error("Unrecognized request: " + JSON.stringify(message));
        }
}


function onopen() {
        allow_recv = true;
}


function onParticipantJoin(request) {
    receiveVideo(request.params.name);
    MashupPlatform.wiring.pushEvent('participant', 'join');
}


function onParticipantLeft(request) {
    console.log('Participant ' + request.params.name + ' left');
    var participant = participants[request.params.name];
    participant.dispose();
    delete participants[request.params.name];
    MashupPlatform.wiring.pushEvent('participant', 'left');
}


window.onload = function () {
    
    'use strict';
    
    function recv_data(data) {
        var main_container = document.getElementById('participant-list');

        while (main_container.firstChild) {
            main_container.removeChild(main_container.firstChild);
            participants = [];
        }
        var data = data.split(' ');
        username  = data[0];
        room_name = data[1];
        join_room();
    }


    function join_room() {
        client.sendRequest('joinRoom', {
            name : username,
            room : room_name,
        }, function(error, result) {
            
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
            
        console.log(username + ' registered in room ' + room_name);
        var participant = new Participant(name);
        participants[username] = participant;
        participant.rtcPeer = kwsUtils.WebRtcPeer.startSendOnly(participant.getVideoElement(), participant.offerToReceiveVideo.bind(participant), null, constraints);
        result.value.forEach(receiveVideo);
        MashupPlatform.wiring.pushEvent('participant', 'join');
        });
    }


    function receiveVideo(sender) {
        var participant = new Participant(sender);
        participants[sender] = participant;
        var video = participant.getVideoElement();
        participant.rtcPeer = kwsUtils.WebRtcPeer.startRecvOnly(video, participant.offerToReceiveVideo.bind(participant));
    }


    MashupPlatform.wiring.registerCallback('join_room', recv_data);
};
