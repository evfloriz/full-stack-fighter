import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(400, 300, 'background').setAlpha(0.5);
        this.cameras.main.setBackgroundColor(0xffffff);

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(400, 300, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(400-230, 300, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('ground', 'platform.png');
        this.load.image('logo', 'logo.png');

        this.load.image('p1_wins', 'p1_wins.png');
        this.load.image('p2_wins', 'p2_wins.png');
        this.load.image('p1_controls', 'p1_controls.png');
        this.load.image('p2_controls', 'p2_controls.png');

        this.load.spritesheet('fighter', 'stickfighter.png', {frameWidth:32, frameHeight:32});
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        this.anims.create({
            key: 'move',
            frames: this.anims.generateFrameNumbers('fighter', { frames: [4,0] }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'stop',
            frames: [{key: 'fighter', frame: 0}],
            frameRate: 10
        });

        this.anims.create({
            key: 'punch',
            frames: this.anims.generateFrameNumbers('fighter', {frames: [1, 2, 2, 1]}),
            frameRate: 10,
            repeat: 0
        });

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
