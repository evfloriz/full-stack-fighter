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

        this.logo = this.add.image(400, 244, 'star').setDepth(100);

        this.add.text(400, 366, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5);

        const socket = io();

        socket.on("connect", () => {
            console.log("Connected: ", socket.id);
        })

        socket.on('check', (msg) => {
            console.log(msg);
        })

        this.registry.set('socket', socket);
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('Game');
    }

}
