// Supabase WebSockets Networking Blueprint
const supabaseConfig = {
    url: 'YOUR_SUPABASE_URL_HERE',
    key: 'YOUR_SUPABASE_ANON_KEY_HERE'
};

const multiplayer = {
    client: null,
    channel: null,
    activeLobby: null,

    init: function() {
        if(typeof supabase !== 'undefined' && supabaseConfig.url !== 'YOUR_SUPABASE_URL_HERE') {
            this.client = supabase.createClient(supabaseConfig.url, supabaseConfig.key);
            console.log("Supabase Client Initialized");
        } else {
            console.warn("Supabase not configured. Multiplayer offline.");
        }
    },

    joinLobby: function(gameId) {
        if(!this.client) {
            if(typeof fx !== 'undefined') fx.toast("Live Multiplayer disconnected. Awaiting Supabase key config.", "error");
            return;
        }

        const roomName = `room_${gameId}_global`;
        
        this.channel = this.client.channel(roomName, {
            config: { presence: { key: app.player.name } }
        });

        // 1. Listen to presence syncs (who is online)
        this.channel.on('presence', { event: 'sync' }, () => {
            const state = this.channel.presenceState();
            console.log('Players in lobby:', state);
            // TODO: Update Lobby UI with player list
        });

        // 2. Listen to broadcast actions (e.g., opponent played a word)
        this.channel.on('broadcast', { event: 'game_action' }, payload => {
            console.log('Opponent action received:', payload);
            this.handlePlayerAction(payload);
        });

        // Subscribe to the channel
        this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                const presenceStatus = await this.channel.track({
                    user: app.player.name,
                    online_at: new Date().toISOString()
                });
                console.log('Joined Lobby:', roomName);
                if(typeof fx !== 'undefined') fx.toast("Connected to Lobby: " + roomName, "success");
            }
        });
    },

    sendAction: function(actionType, data) {
        if(!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'game_action',
            payload: {
                player: app.player.name,
                type: actionType,
                data: data
            }
        });
    },

    handlePlayerAction: function(payload) {
        // Blueprint for syncing words across players
        if(payload.type === 'word_played') {
            console.log(`${payload.player} played ${payload.data.word}`);
            // Hook into Shiritori Royale logic here...
        }
    },

    leaveLobby: function() {
        if(this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
    }
};

window.addEventListener('load', () => multiplayer.init());
