
export enum ExteriorPart {
    WALL = 'wall',
    DOOR = 'door',
    WINDOW = 'window',
    ROOF = 'roof',
}

export type ColorSelection = {
    [key in ExteriorPart]: string;
};
