export const ROOM_CONFIG = {
    WIDTH: 20,
    HEIGHT: 10,
    DEPTH: 25
};

export const CHAIR_CONFIG = {
    ROWS: 5,
    CHAIRS_PER_ROW: 8,
    SPACING: 2,
    ROW_SPACING: 2.5,
    ROW_ELEVATION: -0.5
};

export const COLORS = {
    BACKGROUND: 0x111111,
    FLOOR: 0x4a4a4a,
    CHAIR_DEFAULT: 0x808080,
    CHAIR_SELECTED: 0x00ff00,
    CHAIR_OCCUPIED: 0xff0000,
    PLATFORM: 0x555759
};

export const MATERIALS = {
    FLOOR: {
        roughness: 0.8,
        metalness: 0.2
    },
    WALL: {
        roughness: 0.8,
        metalness: 0.2
    },
    CHAIR: {
        roughness: 0.7,
        metalness: 0.3
    }
};

export const CAMERA = {
    FOV: 75,
    NEAR: 0.1,
    FAR: 1000,
    INITIAL_POSITION: { x: 0, y: 5, z: 15 },
    TRANSITION_DURATION: 1000
};

export const PATHS = {
    TEXTURES: 'textures/',
    MODELS: 'models/',
    VIDEO: 'video/'
}; 