import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { io } from 'socket.io-client'

export class MainMenu extends Scene
{
    logoTween;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.image(400, 300, 'background');

        this.add.image(400, 244, 'logo').setScale(8);

        /*this.add.text(400, 366, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5);*/

        const button = this.add.text(400, 400, 'Play Local', {
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
            button.setBackgroundColor('#557799');
        })
        .on('pointerout', () => {
            button.setBackgroundColor('#7799BB');
        })
        .on('pointerdown', () => {
            this.changeScene('Game');
        })
        .setVisible(true);
        

        const socket = io();

        socket.on("connect", () => {
            console.log("Connected: ", socket.id);
        })

        socket.on('check', (msg) => {
            console.log(msg);
        })

        socket.on('isPlayer1', (msg) => {
            console.log('isPlayer1: ' + msg);
            this.registry.set('isPlayer1', msg);
        });

        this.registry.set('socket', socket);
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene(sceneName)
    {
        this.scene.start(sceneName);
    }

}
