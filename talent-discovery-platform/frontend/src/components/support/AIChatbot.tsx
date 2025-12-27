import React, { useState, useRef, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  ArrowRightIcon,
  SparklesIcon,
  UserIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'How do I upload a video?',
  'How does AI scoring work?',
  'How do I delete my account?',
  'What are clips?',
  'How do I message someone?',
  'Is Get-Noticed free?'
];

const AI_RESPONSES: Record<string, string> = {
  // Upload & Videos
  'how do i upload a video': `To upload a video on Get-Noticed:

1. Click the **Upload** button in the navigation bar
2. Select your video file (MP4, MOV, or WebM, max 500MB)
3. Add a title and description
4. Choose a talent category
5. Add relevant tags
6. Click **Publish**

Your video will be processed automatically. This usually takes 2-5 minutes depending on the file size.`,

  'what are the video requirements': `Video requirements for Get-Noticed:

**Format:** MP4, MOV, or WebM
**Max size:** 500MB
**Duration:** Up to 10 minutes (clips under 60 seconds)
**Resolution:** 720p minimum, 1080p or 4K recommended
**Aspect ratio:** 16:9 (landscape) or 9:16 (portrait/mobile)

**Content guidelines:**
- Original content only
- No explicit/adult content
- No hate speech or harassment
- No copyright infringement`,

  'how do i delete a video': `To delete a video:

1. Go to **Creator Studio** from your profile menu
2. Find the video you want to delete
3. Click the **three dots** menu (⋮) on the video
4. Select **Delete**
5. Confirm the deletion

**Note:** Deleted videos cannot be recovered. All views, likes, and comments will be permanently removed.`,

  'why was my video rejected': `Videos may be rejected for several reasons:

**Common rejection reasons:**
- Copyright music or content
- Adult/explicit material
- Hate speech or harassment
- Spam or misleading content
- Poor video quality (too blurry/dark)
- Duplicate content

**What to do:**
1. Check your email for specific rejection details
2. Edit your video to comply with guidelines
3. Re-upload the corrected version

If you believe this was an error, contact support@get-noticed.com`,

  'how long does processing take': `Video processing time depends on several factors:

**Typical times:**
- Short clips (< 1 min): 1-2 minutes
- Standard videos (1-5 min): 2-5 minutes
- Longer videos (5-10 min): 5-10 minutes

**What happens during processing:**
1. Video encoding for streaming
2. Thumbnail generation
3. AI performance analysis
4. Quality checks

If your video is stuck processing for more than 30 minutes, try re-uploading or contact support.`,

  // Profile & Account
  'how can i edit my profile': `To edit your profile:

1. Click on your avatar in the top right
2. Select **Settings** from the dropdown
3. Update your information:
   - Profile picture
   - Display name
   - Bio/description
   - Location
   - Talent categories
4. Click **Save Changes**

**Tip:** A complete profile with a good photo gets more visibility from agents!`,

  'how do i change my password': `To change your password:

1. Click your avatar → **Settings**
2. Go to the **Security** section
3. Click **Change Password**
4. Enter your current password
5. Enter and confirm your new password
6. Click **Update Password**

**Forgot your password?** Click "Forgot Password" on the login page to reset it via email.`,

  'how do i delete my account': `To delete your account:

1. Go to **Settings** from your profile menu
2. Scroll to **Account** section
3. Click **Delete Account**
4. Enter your password to confirm
5. Click **Permanently Delete**

**Warning:** This action is irreversible. All your videos, followers, messages, and data will be permanently deleted.

If you just want a break, consider deactivating instead of deleting.`,

  'how do i change my username': `To change your username:

1. Go to **Settings** from your profile menu
2. Find the **Username** field
3. Enter your new username
4. Click **Save Changes**

**Note:**
- Usernames must be unique
- Only letters, numbers, and underscores allowed
- 3-30 characters
- Your profile URL will change to the new username`,

  // Features
  'what are clips': `**Clips** are short-form videos under 60 seconds, similar to TikTok or Instagram Reels.

**Why use clips?**
- Quick talent showcases
- Higher engagement rates
- Featured in dedicated Clips section
- Great for going viral

**To create a clip:**
1. Upload a video under 60 seconds
2. Check the "This is a clip" option
3. Your video will appear in the Clips feed

Clips are perfect for quick performances, behind-the-scenes, or highlights!`,

  'how do i create a playlist': `To create a playlist:

1. Go to **Library** from your profile menu
2. Click **Create Playlist**
3. Enter a playlist name and description
4. Click **Create**

**To add videos:**
- While watching any video, click the **Save** icon
- Select which playlist to add it to
- Or click "Create new playlist"

Playlists are great for organizing your favorite content or creating themed collections!`,

  'how do i message someone': `To message another user:

1. Go to their profile
2. Click the **Message** button
3. Type your message and send

**Or from Messages:**
1. Click the envelope icon in the navigation
2. Click **New Message**
3. Search for a username
4. Start chatting

**Note:** Some users may have messaging restricted to followers only.`,

  'how do followers work': `**Followers** are users who subscribe to see your content:

**Benefits of more followers:**
- Your videos appear in their feed
- Higher visibility to agents
- Better ranking in search results
- Unlocks certain features

**To gain followers:**
- Upload quality content regularly
- Engage with the community
- Optimize your profile
- Share your profile link externally

You can see your followers in **Library** → **Followers**.`,

  // AI & Scoring
  'how does ai scoring work': `Our AI Performance Scoring analyzes your video automatically:

**What we measure:**
- **Technical quality** - Video/audio clarity, lighting
- **Performance presence** - Confidence, stage presence
- **Skill demonstration** - Talent-specific abilities
- **Engagement potential** - Likely viewer interest

**Score ranges (0-100):**
- 90-100: Exceptional (featured potential)
- 75-89: Very Good
- 60-74: Good
- Below 60: Room for improvement

**Note:** AI scoring is a guide, not a judgment. Agents consider many factors beyond the score.`,

  // Agents
  'how do i become a verified agent': `To become a verified talent agent:

1. **Sign up** and select "Agent" as your role during registration
2. **Complete your profile** with:
   - Agency name and credentials
   - Professional background
   - Areas of expertise
3. **Submit verification** via Settings → Verification
4. **Wait for review** (2-3 business days)

**Benefits of verification:**
- Verified badge on profile
- Advanced talent search filters
- Casting list features
- Direct messaging to all talent
- Priority support`,

  'what is an agent': `**Agents** on Get-Noticed are entertainment industry professionals who discover and recruit talent.

**What agents can do:**
- Search and filter talent by category, location, skills
- Save talent to casting lists
- Message performers directly
- Add private notes about talent
- Track trending performers

**For performers:** Getting noticed by agents can lead to:
- Audition opportunities
- Representation offers
- Casting calls
- Career guidance`,

  // Monetization
  'is get-noticed free': `**Yes!** Get-Noticed is free for performers:

**Free features:**
- Unlimited video uploads
- AI performance scoring
- Profile and portfolio
- Messaging
- Analytics

**For Agents:**
- Basic features are free
- Premium features may require subscription (coming soon)

We may introduce optional premium features for performers in the future, but core functionality will always be free.`,

  'can i make money': `Currently, Get-Noticed focuses on **discovery**, not direct monetization.

**How Get-Noticed helps your career:**
- Exposure to real talent agents
- Professional portfolio hosting
- AI-powered performance insights
- Networking opportunities

**Future plans may include:**
- Tip/donation features
- Premium subscriptions
- Sponsored content opportunities

**Best way to monetize now:** Use Get-Noticed to get discovered, then pursue opportunities through agents and industry connections.`,

  // Technical
  'video not playing': `If your video won't play, try these steps:

1. **Refresh the page** (Ctrl/Cmd + R)
2. **Clear browser cache** (Settings → Clear browsing data)
3. **Try a different browser** (Chrome, Firefox, Safari)
4. **Check your internet connection**
5. **Disable browser extensions** (ad blockers can interfere)

**Still not working?**
- Check if other videos play
- Try on a different device
- Contact support with the video URL`,

  'how can i contact support': `You can reach our support team through:

**Email:** support@get-noticed.com
**Response time:** 24-48 hours

**Before contacting:**
1. Check this FAQ for quick answers
2. Include your account email
3. Describe the issue in detail
4. Attach screenshots if helpful

**For urgent issues** (account security, harassment):
Mark your email as URGENT in the subject line.`,

  // Default response
  'default': `Hi! I'm here to help you with Get-Noticed. Here are some things I can help with:

**Videos & Uploads**
- How to upload, requirements, processing

**Your Account**
- Profile editing, password, settings

**Features**
- Clips, playlists, messaging, followers

**AI & Scoring**
- How AI analysis works

**Agents**
- Verification, discovery, opportunities

**Technical Help**
- Troubleshooting, support contact

Just type your question or tap a quick question below!`
};

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your Get-Noticed AI assistant. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    // Account deletion
    if (q.includes('delete') && q.includes('account')) {
      return AI_RESPONSES['how do i delete my account'];
    }
    // Video deletion
    if (q.includes('delete') && q.includes('video')) {
      return AI_RESPONSES['how do i delete a video'];
    }
    // Password
    if (q.includes('password') || q.includes('reset password')) {
      return AI_RESPONSES['how do i change my password'];
    }
    // Username
    if (q.includes('username') || q.includes('change name')) {
      return AI_RESPONSES['how do i change my username'];
    }
    // Clips
    if (q.includes('clip') || q.includes('short video') || q.includes('reels') || q.includes('tiktok')) {
      return AI_RESPONSES['what are clips'];
    }
    // Playlist
    if (q.includes('playlist')) {
      return AI_RESPONSES['how do i create a playlist'];
    }
    // Message/chat
    if (q.includes('message') || q.includes('dm') || q.includes('chat')) {
      return AI_RESPONSES['how do i message someone'];
    }
    // Followers
    if (q.includes('follower') || q.includes('following') || q.includes('subscribers')) {
      return AI_RESPONSES['how do followers work'];
    }
    // Video rejected
    if (q.includes('reject') || q.includes('removed') || q.includes('taken down')) {
      return AI_RESPONSES['why was my video rejected'];
    }
    // Processing time
    if (q.includes('processing') || q.includes('how long') || q.includes('stuck')) {
      return AI_RESPONSES['how long does processing take'];
    }
    // Video not playing
    if (q.includes('not playing') || q.includes('won\'t play') || q.includes('not working') || q.includes('broken')) {
      return AI_RESPONSES['video not playing'];
    }
    // Free/cost
    if (q.includes('free') || q.includes('cost') || q.includes('price') || q.includes('pay')) {
      return AI_RESPONSES['is get-noticed free'];
    }
    // Money/monetization
    if (q.includes('money') || q.includes('monetize') || q.includes('earn') || q.includes('income')) {
      return AI_RESPONSES['can i make money'];
    }
    // What is agent
    if (q.includes('what') && q.includes('agent')) {
      return AI_RESPONSES['what is an agent'];
    }
    // Become agent
    if (q.includes('agent') || q.includes('verified') || q.includes('verification')) {
      return AI_RESPONSES['how do i become a verified agent'];
    }
    // AI scoring
    if (q.includes('ai') || q.includes('score') || q.includes('scoring') || q.includes('rating')) {
      return AI_RESPONSES['how does ai scoring work'];
    }
    // Upload
    if (q.includes('upload') || q.includes('post video')) {
      return AI_RESPONSES['how do i upload a video'];
    }
    // Requirements
    if (q.includes('requirement') || q.includes('format') || q.includes('size') || q.includes('resolution')) {
      return AI_RESPONSES['what are the video requirements'];
    }
    // Profile
    if (q.includes('profile') || q.includes('edit') || q.includes('bio')) {
      return AI_RESPONSES['how can i edit my profile'];
    }
    // Support/contact
    if (q.includes('contact') || q.includes('support') || q.includes('email') || q.includes('help')) {
      return AI_RESPONSES['how can i contact support'];
    }

    return AI_RESPONSES['default'];
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = findBestResponse(input);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      const form = document.getElementById('chatbot-form') as HTMLFormElement;
      form?.dispatchEvent(new Event('submit', { bubbles: true }));
    }, 100);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-red-600 hover:bg-red-700
                   text-white shadow-lg hover:shadow-xl
                   transition-all duration-300 hover:scale-110
                   flex items-center justify-center
                   ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]
                      bg-[#1a1a1a] rounded-2xl shadow-2xl
                      border border-[#404040]
                      transition-all duration-300 origin-bottom-right
                      ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#404040]
                      bg-red-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Support</h3>
              <p className="text-xs text-white/80">Always here to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                            ${message.role === 'user'
                              ? 'bg-[#404040] text-white'
                              : 'bg-red-600 text-white'}`}>
                {message.role === 'user' ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <SparklesIcon className="w-4 h-4" />
                )}
              </div>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm
                            ${message.role === 'user'
                              ? 'bg-red-600 text-white rounded-tr-sm'
                              : 'bg-[#282828] text-gray-200 rounded-tl-sm'}`}>
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                  __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }} />
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#282828] p-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
              Quick questions
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q)}
                  className="text-xs px-3 py-1.5 bg-[#282828] text-gray-300
                           rounded-full hover:bg-[#3d3d3d] hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          id="chatbot-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-[#404040]"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#282828]
                       text-white placeholder:text-gray-500
                       border border-[#404040] focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-red-600 text-white rounded-xl
                       hover:bg-red-700 transition-all disabled:opacity-50"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AIChatbot;
