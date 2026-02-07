import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { OpenAIService } from '../../services/OpenAIService';

const VoiceInput = ({ onTranscript, onParsedTransaction, disabled }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsProcessing(true);
                try {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

                    // Transcribe audio
                    const text = await OpenAIService.transcribeAudio(audioFile);
                    setTranscript(text);

                    if (onTranscript) {
                        onTranscript(text);
                    }

                    // Parse into transaction
                    if (onParsedTransaction && text.trim()) {
                        const parsed = await OpenAIService.parseVoiceTransaction(text);
                        onParsedTransaction(parsed);
                    }
                } catch (err) {
                    console.error('Voice processing error:', err);
                    setError('Failed to process voice. Please try again.');
                } finally {
                    setIsProcessing(false);
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone access error:', err);
            setError('Microphone access denied. Please allow microphone access.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const clearTranscript = () => {
        setTranscript('');
        setError(null);
    };

    return (
        <div className="space-y-3">
            {/* Recording Button */}
            <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled || isProcessing}
                className={`
                    w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all
                    ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }
                    ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                    </>
                ) : isRecording ? (
                    <>
                        <MicOff className="w-5 h-5" />
                        <span>Stop Recording</span>
                    </>
                ) : (
                    <>
                        <Mic className="w-5 h-5" />
                        <span>Voice Entry</span>
                    </>
                )}
            </button>

            {/* Recording Indicator */}
            {isRecording && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>Listening... speak your expense</span>
                </div>
            )}

            {/* Transcript Display */}
            {transcript && !isRecording && !isProcessing && (
                <div className="relative bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                    <button
                        onClick={clearTranscript}
                        className="absolute top-2 right-2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <p className="text-sm text-slate-400 mb-1">Heard:</p>
                    <p className="text-slate-200 text-sm pr-6">"{transcript}"</p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}
        </div>
    );
};

export default VoiceInput;
