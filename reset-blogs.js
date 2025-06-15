// Reset blogs script - Creates fresh blog posts in Firestore
// We'll use the admin SDK because it's easier to use in Node.js scripts
const admin = require('firebase-admin');

// Initialize Firebase with the config from our project
const firebaseConfig = {
  apiKey: "AIzaSyAnJBSCXlh_9eX3o0vmSiT6-w5JqIVqR6o",
  authDomain: "ctjsr-c8be4.firebaseapp.com",
  projectId: "ctjsr-c8be4",
  storageBucket: "ctjsr-c8be4.appspot.com",
  messagingSenderId: "512102174837",
  appId: "1:512102174837:web:4fb31f2d181b2378f6683c",
  measurementId: "G-K7PBZ50R78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection name for blogs
const BLOGS_COLLECTION = 'blogs';

// New blog posts data
const newBlogPosts = [
  {
    title: "Latest Web Development Trends in 2025",
    content: `
# Latest Web Development Trends in 2025

Web development has evolved tremendously over the past few years. Here are the top trends to watch in 2025:

## 1. AI-Driven Development Tools

Artificial intelligence is now deeply integrated into development workflows. From auto-completing code to generating entire components based on natural language descriptions, AI tools are accelerating development cycles by 40-60%.

## 2. WebAssembly for Performance-Critical Applications

More developers are turning to WebAssembly (Wasm) for high-performance web applications. This allows compiled languages like Rust and C++ to run in the browser at near-native speed.

## 3. Edge Computing in Web Applications

Edge computing is becoming standard for web applications requiring low latency. By processing data closer to where it's needed, applications see significant performance improvements and reduced bandwidth costs.

## 4. Micro-Frontends Architecture

Large applications are increasingly built using micro-frontends, where different teams can work on separate parts of an application independently using different frameworks if needed.

## 5. Improved Accessibility as Standard

Accessibility is no longer an afterthought but a fundamental requirement from the start of development, with more frameworks providing built-in accessibility features.
    `,
    image: "https://firebasestorage.googleapis.com/v0/b/ctjsr-c8be4.appspot.com/o/blogs%2Fweb-dev-trends.jpg?alt=media",
    category: "Web Development",
    tags: ["JavaScript", "React", "Web Development", "Trends"],
    author: "Alex Johnson",
    date: new Date().toISOString(),
    likes: 135,
    shares: 62,
    status: "Published"
  },
  {
    title: "E-commerce Optimization Strategies for 2025",
    content: `
# E-commerce Optimization Strategies for 2025

In the competitive world of online retail, optimizing your e-commerce store is essential for success. Here are proven strategies for 2025:

## Personalization at Scale

Using AI to create personalized shopping experiences for each visitor has shown to increase conversion rates by up to 25%. Implementing dynamic content, product recommendations, and personalized email marketing campaigns are essential.

## Mobile-First Approach

With over 70% of e-commerce traffic coming from mobile devices, optimizing for mobile isn't optional. Focus on:
- Fast loading times (under 2 seconds)
- Simplified checkout process
- Touch-friendly navigation
- Easy product filtering

## Voice Commerce Integration

Voice shopping is projected to reach $80 billion in yearly revenue by 2025. Integrating voice search capabilities and ensuring your product data is structured for voice queries will give you a competitive edge.

## Sustainability Messaging

Modern consumers care about sustainability. Highlighting eco-friendly practices, sustainable shipping options, and ethical sourcing can significantly impact purchasing decisions.

## Headless Commerce Architecture

Separating your frontend presentation layer from your backend e-commerce functionality allows for greater flexibility, faster page loads, and improved customer experiences.
    `,
    image: "https://firebasestorage.googleapis.com/v0/b/ctjsr-c8be4.appspot.com/o/blogs%2Fecommerce-strategies.jpg?alt=media",
    category: "E-commerce",
    tags: ["E-commerce", "Digital Marketing", "Optimization", "Sales"],
    author: "Samantha Chen",
    date: new Date().toISOString(),
    likes: 98,
    shares: 43,
    status: "Published"
  },
  {
    title: "Building Effective Microservices Architecture",
    content: `
# Building Effective Microservices Architecture

Microservices architecture has revolutionized how we build scalable applications. Here's a comprehensive guide to implementing microservices effectively:

## Key Principles

1. **Single Responsibility**: Each service should focus on solving one specific business problem
2. **Decentralization**: Teams should own their services end-to-end
3. **Domain-Driven Design**: Model services around business domains
4. **Resilience**: Design for failure to ensure system stability

## Implementation Strategies

### API Gateway Pattern

Implement an API gateway to handle cross-cutting concerns like:
- Authentication and authorization
- Request routing
- Rate limiting
- Analytics

### Service Discovery

Use service registry and discovery mechanisms to allow services to find each other dynamically. Popular options include:
- Consul
- Eureka
- Kubernetes service discovery

### Data Management

Each microservice should own its data. Approaches include:
- Database-per-service
- Event sourcing
- CQRS (Command Query Responsibility Segregation)

### Communication Patterns

Choose appropriate communication patterns:
- Synchronous (REST, gRPC)
- Asynchronous (message queues, event streaming)

## Monitoring and Observability

Implement comprehensive monitoring:
- Distributed tracing (Jaeger, Zipkin)
- Metrics collection (Prometheus)
- Centralized logging (ELK stack)
    `,
    image: "https://firebasestorage.googleapis.com/v0/b/ctjsr-c8be4.appspot.com/o/blogs%2Fmicroservices.jpg?alt=media",
    category: "Architecture",
    tags: ["Microservices", "System Design", "Backend", "Cloud"],
    author: "Michael Brown",
    date: new Date().toISOString(),
    likes: 112,
    shares: 57,
    status: "Published"
  },
  {
    title: "Creating Engaging User Experiences with Motion Design",
    content: `
# Creating Engaging User Experiences with Motion Design

Motion design has become a crucial element in creating engaging digital experiences. When implemented thoughtfully, animations can guide users, communicate feedback, and create emotional connections.

## Principles of Effective Motion Design

### Purposeful Animation

Every animation should serve a purpose:
- Draw attention to important elements
- Show relationships between objects
- Provide feedback on user actions
- Orient users during navigation

### Performance Considerations

Animation should never compromise performance:
- Use GPU-accelerated properties (transform, opacity)
- Avoid animating expensive properties (width, height, box-shadow)
- Optimize for 60fps
- Implement reduced motion for accessibility

### Consistency in Motion Language

Develop a consistent motion language for your application:
- Standard durations for different types of animations
- Consistent easing functions
- Deliberate timing relationships

## Implementation Techniques

### CSS Animations

CSS animations and transitions are perfect for simple motions:
\`\`\`css
.element {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.element:hover {
  transform: scale(1.05);
}
\`\`\`

### JavaScript Animation Libraries

For more complex animations, consider libraries like:
- GSAP (GreenSock Animation Platform)
- Framer Motion
- Lottie
- React Spring

## Motion in Design Systems

Integrate motion into your design system:
- Document animation principles
- Create reusable animation components
- Establish motion patterns for common interactions
    `,
    image: "https://firebasestorage.googleapis.com/v0/b/ctjsr-c8be4.appspot.com/o/blogs%2Fmotion-design.jpg?alt=media",
    category: "UI/UX",
    tags: ["UI", "UX", "Animation", "Design"],
    author: "Emily Zhang",
    date: new Date().toISOString(),
    likes: 87,
    shares: 39,
    status: "Draft"
  }
];

// Function to remove all existing blog posts
async function removeExistingBlogs() {
  try {
    console.log('Removing existing blog posts...');
    const blogsRef = collection(db, BLOGS_COLLECTION);
    const snapshot = await getDocs(blogsRef);
    
    // Delete each document
    const deletePromises = snapshot.docs.map(doc => {
      console.log(`Deleting blog post: ${doc.id}`);
      return deleteDoc(doc.ref);
    });
    
    await Promise.all(deletePromises);
    console.log(`Removed ${snapshot.docs.length} existing blog posts`);
  } catch (error) {
    console.error('Error removing blog posts:', error);
    throw error;
  }
}

// Function to add new blog posts
async function addNewBlogs() {
  try {
    console.log('Adding new blog posts...');
    const blogsRef = collection(db, BLOGS_COLLECTION);
    
    // Add each new blog post
    for (const blog of newBlogPosts) {
      // Add timestamps
      const blogWithTimestamps = {
        ...blog,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(blogsRef, blogWithTimestamps);
      console.log(`Added blog post: ${docRef.id} - "${blog.title}"`);
    }
    
    console.log(`Added ${newBlogPosts.length} new blog posts`);
  } catch (error) {
    console.error('Error adding blog posts:', error);
    throw error;
  }
}

// Main function to reset blogs
async function resetBlogs() {
  try {
    console.log('Starting blog reset process...');
    
    // Remove existing blogs
    await removeExistingBlogs();
    
    // Add new blogs
    await addNewBlogs();
    
    console.log('Blog reset process completed successfully!');
  } catch (error) {
    console.error('Error in blog reset process:', error);
  }
}

// Execute the reset
resetBlogs();
