var MashupPlatform = new MockMP.MockMP();
MashupPlatform.setStrategy(MockMP.Strategy.EXCEPTION);

describe('Test room-viewer-widget Constructor', function () {
    "use strict";
    var roomViewer = null;
    var username = 'Nombre';
    var roomName = 'Room';
    var DOM = {};

    beforeEach(function () {
        MashupPlatform.context.get.and.returnValue(username);
        MashupPlatform.mashup.context.get.and.returnValue(roomName);
        MashupPlatform.wiring.registerCallback.and.stub();

        ["participant-list", "create", "leave"].forEach(function(value) {

            var elem = document.createElement('div');
            elem.id = value;
            DOM[value] = elem;
            document.body.appendChild(elem);
        });

        roomViewer = new RoomViewer();
    });

    afterEach(function () {
        DOM = null;
        roomViewer = null;
    });

    it('should add "join_room" callback', function () {

        expect(MashupPlatform.wiring.registerCallback).toHaveBeenCalledWith('join_room', jasmine.any(Function));
    });
});
