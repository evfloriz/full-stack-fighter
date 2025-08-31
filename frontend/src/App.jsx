import { useRef, useState } from 'react';

import Phaser from 'phaser';
import { PhaserGame } from './PhaserGame';

function App ()
{    
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef();

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
        </div>
    )
}

export default App
