import { JwtPayload } from 'jsonwebtoken';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { Chat } from '../chat/chat.model';
import mongoose from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { redis } from '../../../shared/redisClient';
import { Server } from 'socket.io';
import { NotificationServices } from '../notification/notification.service';
import { emailHelper } from '../../../helpers/emailHelper';

const sendMessageToDB = async (payload: any) => {
  const response = await Message.create(payload);

  const populatedResponse = await response.populate('sender', 'firstName lastName email profile role');

  const chatId = payload.chatId;

  // Safe cache invalidation - never fail if Redis is closed or not configured
  if (redis && redis.isOpen) {
    try {
      const keys = await redis.keys(`chat:${chatId}:user:*`);
      if (keys.length > 0) {
        await redis.del(keys);
        console.log(`[Cache] Invalidated ${keys.length} keys for chat ${chatId}`);
      }
    } catch (redisError) {
      console.warn('[Redis Cache Invalidation Warning]:', redisError);
    }
  }

  const io = (global as any).socketServer as Server;
  if (io) {
    // Broadcast message to chat room and specific chat listener
    io.emit(`getMessage::${chatId}`, populatedResponse);
    io.to(`chat:${chatId}`).emit(`getMessage::${chatId}`, populatedResponse);
  }

  // Handle participant notifications asynchronously so message sending is instantaneous
  setImmediate(async () => {
    try {
      const chat = await Chat.findById(chatId).populate('participants', 'firstName lastName email profile role');
      if (chat && chat.participants && chat.participants.length > 0) {
        const senderObj: any = populatedResponse.sender || {};
        const senderName = `${senderObj.firstName || ''} ${senderObj.lastName || ''}`.trim() || senderObj.email || 'Someone';
        const senderRole = senderObj.role ? ` (${senderObj.role})` : '';
        const textPreview = payload.text
          ? (payload.text.length > 80 ? payload.text.substring(0, 77) + '...' : payload.text)
          : (payload.images && payload.images.length > 0 ? 'Sent an attachment' : 'Sent a message');

        for (const participant of chat.participants as any[]) {
          const participantIdStr = participant._id.toString();
          const senderIdStr = payload.sender?.toString();

          if (participantIdStr !== senderIdStr) {
            let isRecipientActiveInChat = false;
            if (io && io.sockets && io.sockets.adapter) {
              const chatRoom = io.sockets.adapter.rooms.get(`chat:${chatId}`);
              if (chatRoom && chatRoom.size > 0) {
                for (const socketId of chatRoom) {
                  const s = io.sockets.sockets.get(socketId);
                  if (s && s.data && s.data.userId === participantIdStr) {
                    isRecipientActiveInChat = true;
                    break;
                  }
                }
              }
            }

            // 1. In-App Notification (also handles device push notification via Firebase)
            try {
              await NotificationServices.createNotification({
                receiver: participant._id,
                sender: payload.sender,
                title: `New message from ${senderName}${senderRole}`,
                message: textPreview,
                text: textPreview,
                type: 'MESSAGE',
                refId: chatId,
                path: '/chat',
                seen: false,
                read: false,
              });
            } catch (notifError) {
              console.error('Failed to create in-app message notification:', notifError);
            }

            // 2. Email Notification if participant is NOT active in this chat
            if (!isRecipientActiveInChat && participant.email) {
              try {
                const emailHtml = `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                    <div style="display: flex; align-items: center; margin-bottom: 24px;">
                      <h2 style="color: #059669; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Share Network</h2>
                    </div>
                    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #065f46; font-size: 15px; font-weight: 600;">
                        💬 New Message from ${senderName}
                      </p>
                    </div>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
                      Hello <strong>${participant.firstName || 'there'}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
                      You received a new message while you were away from the conversation:
                    </p>
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 14px; color: #1e293b; line-height: 1.5;">
                      <div style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">${senderName}:</div>
                      <div style="font-style: italic; color: #334155;">"${textPreview}"</div>
                    </div>
                    <div style="margin-bottom: 28px;">
                      <a href="https://share-network.org" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);">
                        View Message in Chat
                      </a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                      You received this email because you have notifications enabled on Share Network. If you are already active in the chat, you can safely disregard this message.
                    </p>
                  </div>
                `;
                await emailHelper.sendEmail({
                  to: participant.email,
                  subject: `New message from ${senderName} on Share Network`,
                  html: emailHtml,
                });
                console.log(`[Email Notification] Successfully dispatched to ${participant.email}`);
              } catch (emailErr) {
                console.warn(`[Email Notification Warning] Could not send to ${participant.email}:`, emailErr);
              }
            }
          }
        }
      }
    } catch (chatLookupError) {
      console.error('Failed to process message notifications:', chatLookupError);
    }
  });

  return populatedResponse;
};

const getMessageFromDB = async (user: JwtPayload, id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Chat ID');
  }

  const cacheKey = `chat:${id}:user:${user.id}:allMessages`;

  // Try Redis cache only if Redis is actually open
  if (redis && redis.isOpen) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('[Redis Cache] HIT:', cacheKey);
        return JSON.parse(cached) as { messages: IMessage[], participant: any };
      }
    } catch (redisError) {
      console.warn('[Redis Cache] MISS/ERROR:', redisError);
    }
  }

  const messages = await Message.find({ chatId: id })
    .sort({ createdAt: -1 })
    .populate('sender', 'firstName lastName email profile profileImg');

  const participantDoc = await Chat.findById(id).populate({
    path: 'participants',
    select: 'firstName lastName email profile location role',
    match: { _id: { $ne: user.id } }
  });

  const response = {
    messages,
    participant: participantDoc?.participants[0] || null
  };

  // Cache in Redis if open
  if (redis && redis.isOpen) {
    try {
      await redis.set(cacheKey, JSON.stringify(response), { EX: 300 });
      console.log('[Redis Cache] SET:', cacheKey);
    } catch (cacheError) {
      console.warn('[Redis Cache Set] WARNING:', cacheError);
    }
  }

  return response;
};

const updateMessageFromDB = async (id: string, payload: any) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Message ID');
  }

  const result = await Message.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteMessageFromDB = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Message ID');
  }

  const result = await Message.findByIdAndDelete(id);
  return result;
};

export const MessageService = {
  sendMessageToDB,
  getMessageFromDB,
  updateMessageFromDB,
  deleteMessageFromDB,
};
