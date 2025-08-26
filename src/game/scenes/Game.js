import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    player;
    keys;
    gameOver = false;
    p1keybinds = new Map();
    p2keybinds = new Map();
    
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
    
        this.player1 = this.initPlayer(100, 300);
        this.player2 = this.initPlayer(700, 300);

        this.player2.setFlipX(true);

        this.player1.setDebug(true);
        this.player2.setDebug(false);
        
        this.physics.add.collider(this.player1, platforms);
        this.physics.add.collider(this.player2, platforms);
        this.physics.add.collider(this.player1, this.player2);

        this.initKeybinds();



        // hitbox experiments

        this.hitbox = this.add.zone(100, 300).setSize(128, 224);
        this.physics.world.enable(this.hitbox);
        this.hitbox.body.setAllowGravity(false);
        this.hitbox.body.debugBodyColor = 0x00AA00;

        this.hurtbox = this.add.zone(700, 300).setSize(32, 32);
        this.physics.world.enable(this.hurtbox);
        this.hurtbox.body.setAllowGravity(false);
        this.hurtbox.body.debugBodyColor = 0xFF0000;

        // group of attack hitbox zones
        // group of player hitbox zones
        // on attack, add new zone to group

        this.player1.on(Phaser.Animations.Events.ANIMATION_UPDATE, (animation, frame) => {
            if (animation.key == 'punch' && frame.index == 2) {
                console.log("spawn hitbox");
            }
        });

        this.physics.add.overlap(this.player1, this.hurtbox, overlapCallback);

        function overlapCallback(hitbox, hurtbox) {
            console.log("hit");
        }


        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        if (this.gameOver) {
            return;
        }

        this.hitbox.setPosition(this.player1.x, this.player1.y + 16);
        this.hurtbox.setPosition(this.player2.x - 120, this.player2.y + 16);

        this.updatePlayer(this.player1, this.p1keybinds);
        this.updatePlayer(this.player2, this.p2keybinds);
    }

    initPlayer(x, y) {
        let player = this.physics.add.sprite(x, y, 'fighter').setScale(8);

        player.body.setSize(16, 28);
        player.body.setOffset(8, 4);
        
        player.body.setCollideWorldBounds(true);
        player.body.setGravityY(500);

        // switch to stop animation when animation is complete
        player.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function (animation) {
            if (animation.key == 'punch') {
                console.log('punch ended');
                player.anims.play('stop');
            }
        });

        return player
    }

    updatePlayer(player, keybinds) {
        
        let isAttacking = false;
        if (player.anims.currentAnim != null && player.anims.currentAnim.key == 'punch') {
            //console.log(player.anims.currentAnim.key);
            isAttacking = true;
        }

        // attack animations take priority
        if (isAttacking) {
            // set velocity to zero if we land while attacking in air
            if (player.body.touching.down) {
                player.setVelocityX(0);
            }
            return; 
        }

        // attack inputs have highest priority
        if (keybinds.get('punch').isDown) {
            if (player.body.touching.down) {
                player.setVelocityX(0);
            }
            
            player.anims.play('punch', true);
            isAttacking = true;
        }
        else if (keybinds.get('left').isDown && player.body.touching.down)
        {
            player.setVelocityX(-160);
            player.anims.play('move', true);
        }
        else if (keybinds.get('right').isDown && player.body.touching.down)
        {
            player.setVelocityX(160);
            player.anims.play('move', true);
        }
        else
        {
            if (player.body.touching.down) {
                player.setVelocityX(0);
            }
            
            player.anims.play('stop');
        }

        if (keybinds.get('up').isDown && player.body.touching.down)
        {
            player.setVelocityY(-500);
        }
    }

    initKeybinds() {
        // Pulled to a new function for cleaner organization, think I'll have to refactor

        // TODO: want this associated with a player. maybe a distinct player object
        // with all the data one would need? ie sprite + keybinds + etc.
        // Or is this global state information?
        
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E,I,J,K,L,U');

        this.p1keybinds.set('up', this.keys.W);
        this.p1keybinds.set('left', this.keys.A);
        this.p1keybinds.set('down', this.keys.S);
        this.p1keybinds.set('right', this.keys.D);
        this.p1keybinds.set('punch', this.keys.E);

        this.p2keybinds.set('up',this.keys.I);
        this.p2keybinds.set('left', this.keys.J);
        this.p2keybinds.set('down', this.keys.K);
        this.p2keybinds.set('right', this.keys.L);
        this.p2keybinds.set('punch', this.keys.U);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
