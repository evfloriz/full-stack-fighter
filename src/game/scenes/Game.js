import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    player;
    keys;
    gameOver = false;
    isAttacking = false;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.add.image(400, 300, 'background').setAlpha(0.5);
        this.cameras.main.setBackgroundColor(0xffffff);

        let platforms = this.physics.add.staticGroup();

        platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    
        this.player = this.physics.add.sprite(100, 300, 'fighter').setScale(8);

        this.player.body.setSize(16, 28);
        this.player.body.setOffset(8, 4);
        
        //this.player.setBounce(0.2);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(500);

        

        this.physics.add.collider(this.player, platforms);

        this.keys = this.input.keyboard.addKeys('W,A,S,D,U');
        
        let score = 0;
        let scoreText;

        scoreText = this.add.text(16, 16, 'Score: 0', {fontSize: '32px', fill: '#000'});


        this.player.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function () {
            this.isAttacking = false;
        }, this);


        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        if (this.gameOver) {
            return;
        }

        // attack animations take priority
        if (this.isAttacking) {
            // set velocity to zero if we land while attacking in air
            if (this.player.body.touching.down) {
                this.player.setVelocityX(0);
            }
            return; 
        }

        // attack inputs have highest priority
        if (this.keys.U.isDown) {
            if (this.player.body.touching.down) {
                this.player.setVelocityX(0);
            }
            
            this.player.anims.play('punch', true);
            this.isAttacking = true;
        }
        else if (this.keys.A.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityX(-160);
            this.player.anims.play('move', true);
        }
        else if (this.keys.D.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityX(160);
            this.player.anims.play('move', true);
        }
        else
        {
            if (this.player.body.touching.down) {
                this.player.setVelocityX(0);
            }
            
            this.player.anims.play('stop');
        }

        if (this.keys.W.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-500);
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
