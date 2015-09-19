var socket;
	
var myUserID;
var connectedUsers;
var chatUsers = [];
var currentChat = [];
var existingChats = [];
var existingChatGroups = [];
var displayedChat;
var userTemplate = '<tr class="user" id="userID"><td>userID</td></tr>';
var inboxTemplate = '<tr class="chat-inbox" id="recipients"><td>recipients<br>message</td></tr>';
var messageTemplate = '<tr class="chatmessages"><td>%recipients%<br>%message%</td></tr>';

$( document ).ready(function() {

	socket = io();

	/* Initialization and setting up users */

	socket.on('user-connected', function (data) {
		connectedUsers.push(data.userID);
		$('#connected').append(userTemplate.replace(new RegExp('userID', 'g'), data.userID));
	});

	socket.on('user-disconnected', function (data) {
		connectedUsers.splice(connectedUsers.indexOf(data.userID), 1);
		currentChat.splice(connectedUsers.indexOf(data.userID), 1);
		$('#' + data.userID).remove();
	});

	socket.on('initial-connection', function(data) {
		myUserID = data.myID;
		connectedUsers = data.connected;
		for (i=0; i < data.connected.length; i++) {
			$('#connected').append(userTemplate.replace(new RegExp('userID', 'g'), data.connected[i]));
		}
	});

	socket.on('outgoing-message', function (data) {
		// Should have most actions because any action that actually has effect goes through the server, which sends most signals on this channel.

		var recipientString = data.recipients.sort().toString().replace(/,/g, '');

		if ( existingChats.indexOf(recipientString) > -1 ) {

			$( jq(recipientString) + '.chat-inbox > td').text(recipientString + '\n' + data.message);

			if (displayedChat == recipientString) {
				$( '#chatmessagestable' ).prepend(messageTemplate.replace('%message%', data.message).replace('%recipients%', recipientString));
			}

		} else {

			existingChats.push(recipientString);
			existingChatGroups.push(data.recipients);

			$('#messagesinbox').prepend(inboxTemplate.replace(/recipients/g, recipientString).replace('message', data.message));
			//console.log(recipientString);
		}
		// consider same group of people, different order


	});

	$('#userstable').on('click', 'tr' , function (event) {
		var rowIndex = $(this).closest('tr').prevAll().length;
		if (chatUsers.indexOf(connectedUsers[rowIndex]) > -1) {
			chatUsers.splice(chatUsers.indexOf(connectedUsers[rowIndex]), 1);
			$(this).css('background-color', 'cyan');
		} else {
			chatUsers.push(connectedUsers[rowIndex]);
			$(this).css('background-color', 'blue');
		}
	}); // function is perfect



	$('#messagesinbox').on('click', 'tr' , function (event) {
		var index = existingChats.length - $(this).closest('tr').prevAll().length - 1;
		displayedChat = existingChats[index];
		currentChat = existingChatGroups[index];

		$(this).parent().children().css('background-color', 'cyan');
		$(this).css('background-color', 'lawngreen');
		$( '#chatmessagestable' ).empty();
		$( jq('message-box') ).val('');
	});

	$('#initiate-chat').on('click', function (event) {
		if (chatUsers.length > 0) {

			currentChat = chatUsers;
			currentChat.push(myUserID);
			chatUsers = [];
			displayedChat = currentChat.sort().toString().replace(/,/g, '');

			if ( existingChats.indexOf(displayedChat) == -1 ) {

				existingChats.push(displayedChat);
				existingChatGroups.push(currentChat);
				$('#messagesinbox').prepend(inboxTemplate.replace(/recipients/g, displayedChat).replace('message', '(Just Created)'));

			}

			$('#messagesinbox' ).children().css('background-color', 'cyan');
			$('#messagesinbox > ' + jq(displayedChat) ).css('background-color', 'lawngreen');

			$( '#connected' ).children().css('background-color', 'cyan');
			$( '#chatmessagestable' ).empty();
			$( jq('message-box') ).val('');

		}
	});

	/* Sending the message */

	$('#message-box').on('keyup', function(e) {
    	if (e.which == 13) {
        	e.preventDefault();
        	if (currentChat.length > 0) {
        		sendMessage();
        	}
    	}
	});

});

function sendMessage() {
	socket.emit('incoming-message', {
		sender: myUserID,
		recipients: currentChat,
		message: $('#message-box').val().replace(/\s+/g,' ').trim()
	});
	$( jq('message-box') ).val('');
}

/* use functions */

function jq( myid ) {
    return "#" + myid.replace( /(:|\.|\[|\]|,)/g, "\\$1" );
}

function checkArrays( arrA, arrB ){
    if(arrA.length !== arrB.length) return false;
    var cA = arrA.slice().sort().join(','); 
    var cB = arrB.slice().sort().join(',');
    return cA===cB;

}