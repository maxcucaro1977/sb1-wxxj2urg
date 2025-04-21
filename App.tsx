import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { io } from 'socket.io-client';
import {
  RTCPeerConnection,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';
import Geolocation from '@react-native-community/geolocation';

const SOCKET_URL = 'https://armony.onrender.com';

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function App(): JSX.Element {
  const [isConnected, setIsConnected] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.FOREGROUND_SERVICE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];

        const results = await Promise.all(
          permissions.map(permission => PermissionsAndroid.request(permission))
        );

        return results.every(result => result === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.error('Errore nella richiesta dei permessi:', err);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      setError(`Errore di connessione: ${err.message}`);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setError('Disconnesso dal server');
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, []);

  const startScreenShare = async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setError('Permessi non concessi');
        return;
      }

      const stream = await mediaDevices.getDisplayMedia();
      
      // Aggiungi l'audio allo stream
      const audioStream = await mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      audioStream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });

      setIsSharing(true);

      // Invia lo stream completo
      socket.emit('stream-data', { 
        track: stream.getTracks()[0],
        audio: true,
        location: await getCurrentLocation()
      });

      stream.getTracks()[0].onended = () => {
        setIsSharing(false);
        stream.getTracks().forEach(track => track.stop());
      };
    } catch (err) {
      setIsSharing(false);
      setError(err instanceof Error ? err.message : 'Errore durante la condivisione');
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position.coords),
        error => reject(error),
        { enableHighAccuracy: true }
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>
          {isConnected ? 'Connesso' : 'Disconnesso'}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (!isConnected || isSharing) && styles.buttonDisabled,
          ]}
          onPress={startScreenShare}
          disabled={!isConnected || isSharing}
        >
          <Text style={styles.buttonText}>
            {isSharing ? 'Condivisione in corso...' : 'Condividi Schermo'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1f2937',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#b91c1c',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default App;