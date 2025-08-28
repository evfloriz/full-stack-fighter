import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    gameOverCheck = false;
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
    
        this.player1 = this.initPlayer(100, 300, 1);
        this.player2 = this.initPlayer(700, 300, -1);

        // TODO: is this bad?
        this.player1.opponent = this.player2;
        this.player2.opponent = this.player1;

        this.player2.sprite.setFlipX(true);

        this.player1.sprite.setDebug(false);
        this.player2.sprite.setDebug(false);

        this.setupHitboxes(this.player1);
        this.setupHitboxes(this.player2);
        
        this.physics.add.collider(this.player1.sprite, platforms);
        this.physics.add.collider(this.player2.sprite, platforms);
        this.physics.add.collider(this.player1.sprite, this.player2.sprite);

        this.initKeybinds();

        // UI (health bars)
        // To decrease health:
        //      p1: increase x, decrease width by same amount
        //      p2: decrease width
        // A full health bar is 300 pixels
        let p1HealthBarEmpty = this.add.rectangle(50, 100, 300, 10, 0x444444);
        this.p1HealthBar = this.add.rectangle(50, 100, 300, 10, 0xFFFF00);
        p1HealthBarEmpty.setOrigin(0, 0);
        this.p1HealthBar.setOrigin(0, 0);

        let p2HealthBarEmpty = this.add.rectangle(450, 100, 300, 10, 0x444444);
        this.p2HealthBar = this.add.rectangle(450, 100, 300, 10, 0xFFFF00);
        p2HealthBarEmpty.setOrigin(0, 0);
        this.p2HealthBar.setOrigin(0, 0);

        //let p1_wins = this.add.image(400, 200, 'p1_wins').setScale(8);
        //p1_wins.setVisible(false)

        // TODO: maybe a player health listener? For the health bars and also for the
        // game over state? Gotta get more familiar with js listeners


        // initialize the socket
        this.socket = this.registry.get('socket');
        //this.socket.emit('test', 'test_value');

        this.isPlayer1 = this.registry.get('isPlayer1');
        this.player = this.isPlayer1 ? this.player1 : this.player2;

        

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        // Match healthbars to health
        this.p1HealthBar.width = Math.max(this.player1.health * 3, 0);
        this.p1HealthBar.x = 50 + (300 - Math.max(this.player1.health * 3, 0));
        this.p2HealthBar.width = this.player2.health * 3;

        // Game over check
        if (this.player1.health <= 0 || this.player2.health <= 0) {
            //this.changeScene();
            this.updateGameOver(this.player1);
            this.updateGameOver(this.player2);
            return;
        }
        
        // Move hitboxes and hurtboxes based on player positions
        this.player1.hitboxes.children.iterate((child) => {
            child.setPosition(this.player1.sprite.x, this.player1.sprite.y + 16);
        });

        this.player2.hitboxes.children.iterate((child) => {
            child.setPosition(this.player2.sprite.x, this.player2.sprite.y + 16);
        });

        if (this.player1.hurtbox) {
            this.player1.hurtbox.setPosition(this.player1.sprite.x + (this.player1.direction * 100), this.player1.sprite.y + 16)
        }

        if (this.player2.hurtbox) {
            this.player2.hurtbox.setPosition(this.player2.sprite.x + (this.player2.direction * 100), this.player2.sprite.y + 16)
        }

        //this.updatePlayer(this.player1, this.p1keybinds);
        //this.updatePlayer(this.player2, this.p2keybinds);
        this.updatePlayerLocal(this.player, this.p1keybinds);
        this.sendPlayerData(this.player);
        this.receiveOpponentData(this.player.opponent);
    }

    initPlayer(x, y, direction) {
        let sprite = this.physics.add.sprite(x, y, 'fighter').setScale(8);

        sprite.body.setSize(16, 28);
        sprite.body.setOffset(8, 4);
        
        sprite.body.setCollideWorldBounds(true);
        sprite.body.setGravityY(500);

        // switch to stop animation when animation is complete
        sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function (animation) {
            if (animation.key == 'punch') {
                sprite.anims.play('stop');
            }
        });

        // create hitboxes
        // TODO: I think a group isnt ideal, maybe just a tuple since I might wanna separate high
        // and low hitbox collisions
        let hitboxes = this.physics.add.group();
        let hitbox = this.add.zone(x, y).setSize(128, 224);
        hitboxes.add(hitbox);

        hitboxes.children.iterate((child) => {
            this.physics.world.enable(child);
            child.body.setAllowGravity(false);
            child.body.debugBodyColor = 0x00AA00;
        });

        let player = {
            sprite: sprite,
            hitboxes: hitboxes,
            direction: direction,
            health: 100,
            isKnockedBack: false
        };

        return player;
    }

    updatePlayerLocal(player, keybinds) {

        if (player.isKnockedBack) {
            // Wait out knockback
            player.sprite.anims.play('stop');
            return;
        }

        let isAttacking = false;
        if (player.sprite.anims.currentAnim != null && player.sprite.anims.currentAnim.key == 'punch') {
            //console.log(player.anims.currentAnim.key);
            isAttacking = true;
        }

        // attack animations take priority
        if (isAttacking) {
            // set velocity to zero if we land while attacking in air
            if (player.sprite.body.touching.down) {
                player.sprite.setVelocityX(0);
            }
            return; 
        }

        // attack inputs have highest priority
        if (keybinds.get('punch').isDown) {
            if (player.sprite.body.touching.down) {
                player.sprite.setVelocityX(0);
            }
            
            player.sprite.anims.play('punch', true);
            isAttacking = true;
        }
        else if (keybinds.get('left').isDown && player.sprite.body.touching.down)
        {
            player.sprite.setVelocityX(-160);
            player.sprite.anims.play('move', true);
        }
        else if (keybinds.get('right').isDown && player.sprite.body.touching.down)
        {
            player.sprite.setVelocityX(160);
            player.sprite.anims.play('move', true);
        }
        else
        {
            if (player.sprite.body.touching.down) {
                player.sprite.setVelocityX(0);
            }
            
            player.sprite.anims.play('stop');
        }

        if (keybinds.get('up').isDown && player.sprite.body.touching.down)
        {
            player.sprite.setVelocityY(-500);
        }
    }

    sendPlayerData(player) {
        let eventName = this.isPlayer1 ? 'player1_position' : 'player2_position';

        this.socket.emit(eventName, {'x': player.sprite.x, 'y': player.sprite.y});
    }

    receiveOpponentData(player) {
        let eventName = !this.isPlayer1 ? 'player1_position' : 'player2_position';

        this.socket.on(eventName, (data) => {
            player.sprite.x = data.x;
            player.sprite.y = data.y;
        })
    }

    updateGameOver(player) {
        // Game over state
        if (player.sprite.body.touching.down) {
            player.sprite.setVelocityX(0);
        }
        
        player.sprite.anims.play('stop');
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

    setupHitboxes(player) {
        player.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, (animation, frame) => {
            if (animation.key == 'punch' && frame.index == 2) {
                player.hurtbox = this.add.zone(player.sprite.x + (player.direction * 100), player.sprite.y + 16).setSize(32, 32);
                this.physics.world.enable(player.hurtbox);
                player.hurtbox.body.setAllowGravity(false);
                player.hurtbox.body.debugBodyColor = 0xFF0000;

                this.physics.add.overlap(player.opponent.hitboxes, player.hurtbox, (hitbox, hurtbox) => {
                    // On hit action
                    player.hurtbox.destroy();

                    player.opponent.health -= 10;
                    //player.opponent.sprite.setVelocityY(-100);
                    player.opponent.sprite.setVelocityX(player.direction * 200);
                    player.opponent.isKnockedBack = true;
                    this.time.delayedCall(100, () => {
                        player.opponent.isKnockedBack = false;
                    });
                    
                });
            }
            else if (animation.key == 'punch' && frame.index == 4) {
                player.hurtbox.destroy();
            }
        });
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
