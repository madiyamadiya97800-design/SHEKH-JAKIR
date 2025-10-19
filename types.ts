export enum ExteriorPart {
    WALL = 'wall',
    DOOR = 'door',
    WINDOW = 'window',
    ROOF = 'roof',
    RAILING = 'railing',
    FEATURE_WALL_1 = 'feature_wall_1',
    FEATURE_WALL_2 = 'feature_wall_2',
}

export type ColorSelection = {
    [key in ExteriorPart]: string;
};