-- Migration: Update Chat for Private Messaging
ALTER TABLE chat_messages ADD COLUMN recipient_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for faster retrieval of private conversations
CREATE INDEX idx_chat_private_conv ON chat_messages(sender_id, recipient_id);
