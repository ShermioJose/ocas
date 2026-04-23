import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import styles from './Messages.module.css';

const Messages = () => {
    const { token, user } = useAuth();
    const location = useLocation();
    
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [isTypingMap, setIsTypingMap] = useState({});
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Initial Load - Conversations
    useEffect(() => {
        const fetchConvs = async () => {
            try {
                const res = await api.get('/conversations');
                if (res.data.success) {
                    setConversations(res.data.conversations);
                    
                    // Handle pre-selected conversation from AdDetail navigation
                    if (location.state?.conversationId) {
                        const targetConv = res.data.conversations.find(c => c.id === location.state.conversationId);
                        if (targetConv) {
                            setActiveConv(targetConv);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load conversations");
            } finally {
                setLoadingConvs(false);
            }
        };
        fetchConvs();

        const handleResize = () => setIsMobileView(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [location]);

    // Socket.io Setup
    useEffect(() => {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
        if (token) {
            socketRef.current = io(socketUrl, {
                auth: { token }
            });

            socketRef.current.on('connect', () => {
                console.log("Socket connected");
            });

            socketRef.current.on('new_message', (msg) => {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
                
                // Update conversation list preview & unread count if it's not the active one
                setConversations(prev => prev.map(c => {
                    if (c.id === msg.conversation_id) {
                        return {
                            ...c,
                            last_message: msg.message,
                            last_message_at: msg.created_at,
                            unread_count: (activeConv?.id !== msg.conversation_id && msg.sender_id !== user.id) 
                                            ? c.unread_count + 1 : c.unread_count
                        };
                    }
                    return c;
                }).sort((a,b) => new Date(b.last_message_at) - new Date(a.last_message_at)));

                // If this is the active conversation and msg is from someone else, mark it read via socket
                setActiveConv((currentActive) => {
                    if(currentActive && currentActive.id === msg.conversation_id && msg.sender_id !== user.id) {
                         socketRef.current.emit('mark_read', { conversation_id: msg.conversation_id });
                    }
                    return currentActive;
                });
            });

            socketRef.current.on('user_typing', (data) => {
                setIsTypingMap(prev => ({ ...prev, [data.conversation_id]: true }));
            });

            socketRef.current.on('user_stopped_typing', (data) => {
                setIsTypingMap(prev => ({ ...prev, [data.conversation_id]: false }));
            });

            return () => socketRef.current.disconnect();
        }
    }, [token, activeConv, user.id]);

    // Fetch messages when active conversation changes
    useEffect(() => {
        if (activeConv) {
            const fetchMessages = async () => {
                setLoadingMsgs(true);
                try {
                    const res = await api.get(`/conversations/${activeConv.id}/messages`);
                    if (res.data.success) {
                        // API returns paginated messages latest first, we need historical order
                        setMessages(res.data.messages.data.reverse());
                        scrollToBottom();
                        
                        // Clear unread count locally
                        setConversations(prev => prev.map(c => c.id === activeConv.id ? {...c, unread_count: 0} : c));
                        
                        // Join socket room
                        socketRef.current.emit('join_conversation', { conversation_id: activeConv.id });
                    }
                } catch (error) {
                    console.error("Failed to load messages");
                } finally {
                    setLoadingMsgs(false);
                }
            };
            fetchMessages();
        }
    }, [activeConv]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || !activeConv) return;

        socketRef.current.emit('send_message', {
            conversation_id: activeConv.id,
            message: inputMsg.trim()
        });
        
        socketRef.current.emit('typing_stop', { conversation_id: activeConv.id });
        setInputMsg('');
    };

    const handleTyping = (e) => {
        setInputMsg(e.target.value);
        if (activeConv) {
            socketRef.current.emit('typing_start', { conversation_id: activeConv.id });
            
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit('typing_stop', { conversation_id: activeConv.id });
            }, 1500);
        }
    };

    if (loadingConvs) return <Loader fullScreen />;

    const showList = !isMobileView || (!activeConv && isMobileView);
    const showChat = !isMobileView || (activeConv && isMobileView);

    return (
        <div className={`page-transition-enter-active ${styles.container}`}>
            <div className={styles.layout}>
                
                {/* Conversations List Panel */}
                {showList && (
                    <div className={styles.listPanel}>
                        <div className={styles.listHeader}>
                            <h2>Messages</h2>
                            <div className={styles.searchBar}>
                                <Search size={16} />
                                <input type="text" placeholder="Search chats..." />
                            </div>
                        </div>

                        <div className={styles.listContent}>
                            {conversations.length === 0 ? (
                                <p className={styles.emptyList}>No conversations yet.</p>
                            ) : (
                                conversations.map(conv => (
                                    <div 
                                        key={conv.id} 
                                        className={`${styles.convItem} ${activeConv?.id === conv.id ? styles.activeConvItem : ''}`}
                                        onClick={() => setActiveConv(conv)}
                                    >
                                        <div className={styles.convAvatar}>
                                            <img src={conv.other_user.avatar_url || 'https://via.placeholder.com/50'} alt="" />
                                            {conv.unread_count > 0 && <span className={styles.unreadBadge}>{conv.unread_count}</span>}
                                        </div>
                                        <div className={styles.convInfo}>
                                            <div className={styles.convInfoTop}>
                                                <h4>{conv.other_user.name}</h4>
                                                <span className={styles.convTime}>
                                                    {conv.last_message_at ? format(new Date(conv.last_message_at), 'HH:mm') : ''}
                                                </span>
                                            </div>
                                            <p className={styles.convAdTitle}>{conv.ad.title}</p>
                                            <p className={styles.convLastMsg}>{conv.last_message || "No messages yet"}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Chat Panel */}
                {showChat && (
                    <div className={styles.chatPanel}>
                        {activeConv ? (
                            <>
                                <div className={styles.chatHeader}>
                                    {isMobileView && (
                                        <button className={styles.backButton} onClick={() => setActiveConv(null)}>
                                            <ArrowLeft size={24} />
                                        </button>
                                    )}
                                    <img src={activeConv.other_user.avatar_url || 'https://via.placeholder.com/40'} alt="" className={styles.chatAvatar} />
                                    <div className={styles.chatHeaderInfo}>
                                        <h3>{activeConv.other_user.name}</h3>
                                        <p className={styles.chatHeaderAd}>{activeConv.ad.title}</p>
                                    </div>
                                    {activeConv.ad.primary_image && (
                                        <img src={activeConv.ad.primary_image} alt="Ad" className={styles.chatHeaderAdImg} />
                                    )}
                                </div>

                                <div className={styles.msgContainer}>
                                    {loadingMsgs ? <Loader /> : (
                                        messages.map((msg, idx) => {
                                            const isMe = msg.sender_id === user.id;
                                            return (
                                                <div key={idx} className={`${styles.msgBubbleWrap} ${isMe ? styles.msgMe : styles.msgOther}`}>
                                                    <div className={styles.msgBubble}>
                                                        <p>{msg.message || msg.content || msg.text}</p>
                                                        <span className={styles.msgTime}>{format(new Date(msg.created_at), 'HH:mm')}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    {isTypingMap[activeConv.id] && (
                                        <div className={`${styles.msgBubbleWrap} ${styles.msgOther}`}>
                                            <div className={`${styles.msgBubble} ${styles.typingBubble}`}>
                                                <div className={styles.dot}></div>
                                                <div className={styles.dot}></div>
                                                <div className={styles.dot}></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form className={styles.inputArea} onSubmit={handleSendMessage}>
                                    <textarea 
                                        placeholder="Type your message..." 
                                        value={inputMsg}
                                        onChange={handleTyping}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        rows="1"
                                    ></textarea>
                                    <button type="submit" disabled={!inputMsg.trim()}>
                                        <Send size={20} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className={styles.chatEmptyState}>
                                <EmptyState icon={MessageSquare} message="Select a conversation to start chatting" />
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Messages;
