import { User } from './../user/user.model';
import { Server } from 'socket.io';
import { IMessage } from '../message/message.interface';
import { Message } from '../message/message.model';
import { IChat } from './chat.interface';
import { Chat } from './chat.model';

const createChatToDB = async (payload: string[]) => {

  // Exact match check (important)
  const isExistChat = await Chat.findOne({
    participants: { $all: payload },
    $expr: { $eq: [{ $size: "$participants" }, payload.length] },
  }).populate("participants", "_id firstName lastName email profile");

  if (isExistChat) {
    return isExistChat;
  }

  const result = await Chat.create({
    participants: payload,
    status: true,
  });

  const Result = await result.populate(
    "participants",
    "_id firstName lastName email profile"
  );

  // socket emit
  const io = (global as any).socketServer as Server;

  if (io) {
    payload.forEach((userId) => {
      io.to(userId).emit("newChat", Result);
    });
  }

  return Result;
};

const getChatFromDB = async (user: any, search: string): Promise<IChat[]> => {

  const chats: any = await Chat.find({ participants: { $in: [user.id] } })
    .populate({
      path: 'participants',
      select: '_id firstName lastName profile email',
      match: {
        _id: { $ne: user.id },
        ...(search && { name: { $regex: search, $options: 'i' } }),
      }
    })
    .select('participants status');

  const filteredChats = chats?.filter(
    (chat: any) => chat?.participants?.length > 0
  );

  const chatList: IChat[] = await Promise.all(
    filteredChats?.map(async (chat: any) => {
      const data = chat?.toObject();

      const lastMessage: IMessage | null = await Message.findOne({ chatId: chat?._id })
        .sort({ createdAt: -1 })
        .select('text offer createdAt sender');

      return {
        ...data,
        lastMessage: lastMessage || null,
      };
    })
  );

  return chatList;
};

export const ChatService = { createChatToDB, getChatFromDB };