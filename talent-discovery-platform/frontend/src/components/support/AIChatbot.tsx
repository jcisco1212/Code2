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
  'How can I edit my profile?',
  'What are the video requirements?',
  'How does AI scoring work?',
  'How do I become a verified agent?',
  'How can I contact support?'
];

const AI_RESPONSES: Record<string, string> = {
  'how do i upload a video': `To upload a video on TalentVault:

1. Click the **Upload** button in the navigation bar
2. Select your video file (MP4, MOV, or WebM, max 500MB)
3. Add a title and description
4. Choose a talent category
5. Add relevant tags
6. Click **Publish**

Your video will be processed and reviewed by our AI system before going live. This usually takes a few minutes.`,

  'how can i edit my profile': `To edit your profile:

1. Click on your avatar in the top right
2. Select **Settings** from the dropdown
3. Update your information:
   - Profile picture
   - Bio/description
   - Location
   - Social media links
   - Talent categories
4. Click **Save Changes**

You can also manage your privacy settings and notification preferences from this page.`,

  'what are the video requirements': `Video requirements for TalentVault:

**Format:** MP4, MOV, or WebM
**Max size:** 500MB
**Duration:** Up to 10 minutes
**Resolution:** 720p minimum, 1080p or 4K recommended
**Aspect ratio:** 16:9 (landscape) or 9:16 (portrait)

**Content guidelines:**
- Original content only
- No explicit/adult content
- No hate speech or harassment
- No copyright infringement
- Family-friendly content preferred`,

  'how does ai scoring work': `Our AI Performance Scoring system analyzes your video to provide insights:

**What we measure:**
- **Technical quality** (video/audio clarity)
- **Performance presence** (confidence, engagement)
- **Skill demonstration** (relevant to your category)
- **Content quality** (originality, creativity)

**Scores range from 0-100:**
- 90+ = Exceptional
- 75-89 = Very Good
- 60-74 = Good
- Below 60 = Room for improvement

Higher scores increase your visibility to talent agents and can lead to being featured on the platform.`,

  'how do i become a verified agent': `To become a verified talent agent:

1. **Create an account** and select "Agent" as your role
2. **Complete your profile** with:
   - Professional credentials
   - Agency affiliation (if applicable)
   - Areas of expertise
   - Contact information
3. **Submit verification** documents:
   - Professional license or credentials
   - Business registration (if applicable)
4. **Wait for review** - Our team will verify your credentials within 2-3 business days

Verified agents get a badge on their profile and priority access to talent discovery features.`,

  'how can i contact support': `You can reach our support team through:

**Email:** support@talentvault.com
**Response time:** 24-48 hours

**In-app help:**
- Use this AI assistant for quick answers
- Submit a support ticket from Settings > Help

**Common issues:**
- Account problems
- Video upload issues
- Payment questions
- Report violations

For urgent matters, please include your account email and a detailed description of the issue.`,

  'default': `I'm here to help you with TalentVault! I can assist with:

- **Uploading videos** - How to upload and optimize your content
- **Profile management** - Editing your profile and settings
- **Video guidelines** - Requirements and best practices
- **AI scoring** - Understanding how our AI evaluates performances
- **Agent verification** - Becoming a verified talent agent
- **Technical support** - Troubleshooting common issues

Feel free to ask me anything, or click one of the quick questions below!`
};

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your TalentVault AI assistant. How can I help you today?`,
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
    const normalizedQuery = query.toLowerCase().trim();

    // Check for keyword matches
    for (const [key, response] of Object.entries(AI_RESPONSES)) {
      if (key !== 'default' && normalizedQuery.includes(key.split(' ').slice(0, 3).join(' '))) {
        return response;
      }
    }

    // Check for partial matches
    if (normalizedQuery.includes('upload') || normalizedQuery.includes('video')) {
      return AI_RESPONSES['how do i upload a video'];
    }
    if (normalizedQuery.includes('profile') || normalizedQuery.includes('edit')) {
      return AI_RESPONSES['how can i edit my profile'];
    }
    if (normalizedQuery.includes('requirement') || normalizedQuery.includes('format')) {
      return AI_RESPONSES['what are the video requirements'];
    }
    if (normalizedQuery.includes('ai') || normalizedQuery.includes('score') || normalizedQuery.includes('scoring')) {
      return AI_RESPONSES['how does ai scoring work'];
    }
    if (normalizedQuery.includes('agent') || normalizedQuery.includes('verified') || normalizedQuery.includes('verification')) {
      return AI_RESPONSES['how do i become a verified agent'];
    }
    if (normalizedQuery.includes('contact') || normalizedQuery.includes('support') || normalizedQuery.includes('help')) {
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
                   bg-gradient-to-r from-primary-500 to-accent-500
                   text-white shadow-lg hover:shadow-xl
                   transition-all duration-300 hover:scale-110
                   flex items-center justify-center
                   ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]
                      bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                      border border-gray-200 dark:border-white/10
                      transition-all duration-300 origin-bottom-right
                      ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10
                      bg-gradient-to-r from-primary-500 to-accent-500 rounded-t-2xl">
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
                              ? 'bg-primary-500 text-white'
                              : 'bg-gradient-to-br from-primary-500 to-accent-500 text-white'}`}>
                {message.role === 'user' ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <SparklesIcon className="w-4 h-4" />
                )}
              </div>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm
                            ${message.role === 'user'
                              ? 'bg-primary-500 text-white rounded-tr-sm'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}>
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                  __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }} />
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-white/10 p-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
              Quick questions
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q)}
                  className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300
                           rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
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
          className="p-4 border-t border-gray-200 dark:border-white/10"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10
                       text-gray-900 dark:text-white placeholder:text-gray-500
                       border-0 focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl
                       hover:shadow-lg transition-all disabled:opacity-50"
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
