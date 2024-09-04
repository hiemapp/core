import DeviceTrait from '../DeviceTrait';

export interface IMusicPlayerTrait {
    state: {
        isPaused: number;
        playlist: {
            currentIndex: number;
        }
    },
    commands: {
        loadSong: {
            params: {
                service: string;
                data: any;
            }
        },
        loadPlaylist: {
            params: {
                service: string;
                data: any;
            }
        }
        playlistGotoIndex: {
            params: {
                index: number;
            }
        },
        pause: {
            params: {
                paused: boolean
            }
        }
    }
    options: {
        pausable: boolean;
        volume?: {
            supported?: boolean;
            min?: number;
            max?: number;
        }
        playlist?: {
            supported?: boolean;
            skipSupported: boolean;
        }
    }
}

export class MusicPlayerTrait extends DeviceTrait<IMusicPlayerTrait> {
    protected init() {
        this.setConfig({
            menu: true
        })

        this.setDefaultOptions({
            pausable: true,
            volume: {
                supported: true,
                min: 0,
                max: 100,
            },
            playlist: {
                supported: true,
                skipSupported: true
            }
        })

        this.setCommandRegistry({
            loadPlaylist: (device, params) => {
               
            },
            loadSong: null,
            playlistGotoIndex: null,
            pause: null
        })
    }
}