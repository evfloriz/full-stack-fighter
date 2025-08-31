import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    gameOverCheck = false;
    p1Keybinds = new Map();
    p2Keybinds = new Map();
    
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

        // TODO: maybe a player health listener? For the health bars and also for the
        // game over state? Gotta get more familiar with js listeners

        // Init keybinds so player updates dont fail
        this.playerInputs = this.getInputs(this.p1Keybinds);
        this.opponentInputs = this.getInputs(this.p2Keybinds);

        this.returnToMenuButton = this.add.text(400, 270, 'Return to Main Menu', {
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
            this.changeScene('Game');
        })
        .setVisible(false);

        this.p1WinImage = this.add.image(400, 200, 'p1_wins').setScale(8);
        this.p2WinImage = this.add.image(400, 200, 'p2_wins').setScale(8);
        this.p1WinImage.setVisible(false);
        this.p2WinImage.setVisible(false);

        // initialize the socket
        this.socket = this.registry.get('socket');
        //this.socket.emit('test', 'test_value');

        // If offline, set this.player to player1
        // If online, check
        this.isPlayer1 = true;
        if (this.socket) {
            this.isPlayer1 = this.registry.get('isPlayer1');
        }
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
            let didPlayer1Win = this.player1.health > 0;
            this.updateGameOver(didPlayer1Win);
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

        this.playerInputs = this.getInputs(this.p1Keybinds);

        this.updatePlayerLocal(this.player, this.playerInputs);
        
        // Get online data if playing online
        if (this.socket) {
            this.sendPlayerData(this.playerInputs);
            this.receiveOpponentData();
        }
        else {
            this.opponentInputs = this.getInputs(this.p2Keybinds);
        }
        
        this.updatePlayerLocal(this.player.opponent, this.opponentInputs)
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

    updatePlayerLocal(player, inputs) {

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
        if (inputs.punch) {
            if (player.sprite.body.touching.down) {
                player.sprite.setVelocityX(0);
            }
            
            player.sprite.anims.play('punch', true);
            isAttacking = true;
        }
        else if (inputs.left && player.sprite.body.touching.down)
        {
            player.sprite.setVelocityX(-160);
            player.sprite.anims.play('move', true);
        }
        else if (inputs.right && player.sprite.body.touching.down)
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

        if (inputs.up && player.sprite.body.touching.down)
        {
            player.sprite.setVelocityY(-500);
        }
    }

    sendPlayerData(inputs) {
        let eventName = this.isPlayer1 ? 'player1_inputs' : 'player2_inputs';

        this.socket.emit(eventName, inputs);
    }

    receiveOpponentData() {
        let eventName = !this.isPlayer1 ? 'player1_inputs' : 'player2_inputs';

        this.socket.on(eventName, (data) => {
            //console.log(data);
            this.opponentInputs = data;
        })
    }

    updateGameOver(didPlayer1Win) {
        // Game over state
        if (this.player1.sprite.body.touching.down) {
            this.player1.sprite.setVelocityX(0);
        }
        this.player1.sprite.anims.play('stop');

        if (this.player2.sprite.body.touching.down) {
            this.player2.sprite.setVelocityX(0);
        }
        this.player2.sprite.anims.play('stop');

        if (didPlayer1Win) {
            this.p1WinImage.setVisible(true);
        }
        else {
            this.p2WinImage.setVisible(true);
        }

        this.returnToMenuButton.setVisible(true);
    }

    initKeybinds() {
        // Pulled to a new function for cleaner organization, think I'll have to refactor

        // TODO: want this associated with a player. maybe a distinct player object
        // with all the data one would need? ie sprite + keybinds + etc.
        // Or is this global state information?
        
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E,I,J,K,L,U');

        this.p1Keybinds.set('up', this.keys.W);
        this.p1Keybinds.set('left', this.keys.A);
        this.p1Keybinds.set('down', this.keys.S);
        this.p1Keybinds.set('right', this.keys.D);
        this.p1Keybinds.set('punch', this.keys.E);

        this.p2Keybinds.set('up',this.keys.I);
        this.p2Keybinds.set('left', this.keys.J);
        this.p2Keybinds.set('down', this.keys.K);
        this.p2Keybinds.set('right', this.keys.L);
        this.p2Keybinds.set('punch', this.keys.U);
    }

    getInputs(keybinds) {
        let inputs = {
            up: keybinds.get('up').isDown,
            down: keybinds.get('down').isDown,
            left: keybinds.get('left').isDown,
            right: keybinds.get('right').isDown,
            punch: keybinds.get('punch').isDown
        }
        return inputs;
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

    changeScene()
    {
        this.scene.start('MainMenu');
    }
}
