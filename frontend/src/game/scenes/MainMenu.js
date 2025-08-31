import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { io } from 'socket.io-client'

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.image(400, 300, 'background').setAlpha(0.5);
        this.cameras.main.setBackgroundColor(0xffffff);

        this.add.image(400, 244, 'logo').setScale(8);

        this.add.image(150, 450, 'p1_controls').setScale(4);
        this.add.image(650, 450, 'p2_controls').setScale(4);

        const localButton = this.add.text(400, 400, 'Play Local', {
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
            localButton.setBackgroundColor('#557799');
        })
        .on('pointerout', () => {
            localButton.setBackgroundColor('#7799BB');
        })
        .on('pointerdown', () => {
            this.changeScene('Game');
        })
        .setVisible(true);

        const onlineButton = this.add.text(400, 480, 'Play Online', {
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
            onlineButton.setBackgroundColor('#557799');
        })
        .on('pointerout', () => {
            onlineButton.setBackgroundColor('#7799BB');
        })
        .on('pointerdown', () => {
            this.changeScene('ConnectToServer');
        })
        .setVisible(true);
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene(sceneName)
    {
        this.scene.start(sceneName);
    }

}
