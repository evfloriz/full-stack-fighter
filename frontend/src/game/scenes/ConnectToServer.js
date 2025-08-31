import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { io } from 'socket.io-client'

export class ConnectToServer extends Scene
{
    constructor ()
    {
        super('ConnectToServer');
    }

    create ()
    {
        this.add.image(400, 300, 'background').setAlpha(0.5);
        this.cameras.main.setBackgroundColor(0xffffff);

        this.add.text(400, 300, 'Searching...', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#111111',
            align: 'center',
        }).setOrigin(0.5);
        
        this.returnToMenuButton = this.add.text(400, 400, 'Return to Main Menu', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#111111',
            align: 'center',
            backgroundColor: '#7799BB'
        })
        .setPadding(16)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerover', () => {
            this.returnToMenuButton.setBackgroundColor('#557799');
        })
        .on('pointerout', () => {
            this.returnToMenuButton.setBackgroundColor('#7799BB');
        })
        .on('pointerdown', () => {
            this.returnToMenu();
        })
        .setVisible(true);
        

        this.socket = io();
        this.registry.set('socket', this.socket);

        this.socket.on("connect", () => {
            // Empty for now
            
            //console.log("Connected to server");
        })

        this.socket.on('isPlayer1', (msg) => {
            //console.log('isPlayer1: ' + msg);
            this.registry.set('isPlayer1', msg);
        });

        // Confirm room ready command
        this.socket.on('isRoomReady', (msg) => {
            this.socket.emit('confirm');

            this.changeScene('Game');
        })
        
        EventBus.emit('current-scene-ready', this);
    }

    returnToMenu() {
        // Disconnect socket and remove from registry
        this.socket.disconnect();
        this.registry.remove('socket');
        this.registry.remove('isPlayer1');

        this.changeScene('MainMenu');
    }

    changeScene(sceneName)
    {
        this.scene.start(sceneName);
    }

}
