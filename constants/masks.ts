import { ExteriorPart } from '../types';

export const MASK_COLORS: Record<ExteriorPart, { name: string, color: string }> = {
    [ExteriorPart.WALL]: { name: 'Deewar (Wall)', color: '#ff0000' }, // red
    [ExteriorPart.FEATURE_WALL_1]: { name: 'Feature Wall 1', color: '#00ff00' }, // green
    [ExteriorPart.FEATURE_WALL_2]: { name: 'Feature Wall 2', color: '#0000ff' }, // blue
    [ExteriorPart.DOOR]: { name: 'Darwaza (Door)', color: '#ffff00' }, // yellow
    [ExteriorPart.WINDOW]: { name: 'Khidki (Window)', color: '#ff00ff' }, // magenta
    [ExteriorPart.ROOF]: { name: 'Chhat (Roof)', color: '#00ffff' }, // cyan
    [ExteriorPart.RAILING]: { name: 'Railing', color: '#ffa500' }, // orange
    [ExteriorPart.LEAVES]: { name: 'Patte (Leaves)', color: '#ffc0cb' }, // pink
};