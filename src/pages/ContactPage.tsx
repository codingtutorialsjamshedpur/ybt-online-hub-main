
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import Firebase utilities
import { addContactSubmission, ContactSubmission } from '@/firebase/firestore';
import { uploadContactAttachment } from '@/firebase/storage';

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Optional fields
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [contactTime, setContactTime] = useState('');
  const [priority, setPriority] = useState('');
  const [fileAttachment, setFileAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare contact submission data
      const contactData: ContactSubmission = {
        name,
        email,
        subject,
        message,
        status: 'new', // Default status for new submissions
        
        // Optional fields - only include if they have values
        ...(phone ? { mobileNo: phone } : {}), // Using mobileNo as field name in Firestore
        ...(department ? { department } : {}),
        ...(contactTime ? { contactTime } : {}),
        ...(priority ? { priority } : {}),
        timestamp: new Date() // Adding timestamp field to match Firestore structure
      };
      
      // Upload file attachment if present
      let attachmentUrl = '';
      if (fileAttachment) {
        // First save contact to get an ID
        const contactId = await addContactSubmission(contactData);
        
        // Then upload the file using the contact ID
        attachmentUrl = await uploadContactAttachment(fileAttachment, contactId);
        
        // Update the contact record with the attachment URL
        await addContactSubmission({
          ...contactData,
          attachmentUrl
        });
      } else {
        // No file to upload, just save the contact
        await addContactSubmission(contactData);
      }
      
      // Show success message
      toast({
        title: "Message sent!",
        description: "We've received your message and will get back to you soon.",
      });
      
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setPhone('');
      setDepartment('');
      setContactTime('');
      setPriority('');
      setFileAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error!",
        description: "There was a problem sending your message. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 animate-fade-in">Contact Us</h1>
        <p className="text-xl mb-8 animate-fade-in">
          Have questions or need assistance? We're here to help. Fill out the form below, and we'll get back to you as soon as possible.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Form */}
          <Card className="p-6 lg:col-span-3 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg">Your Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="text-lg py-6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg">Your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    required
                    className="text-lg py-6"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-lg">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help you?"
                  required
                  className="text-lg py-6"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message" className="text-lg">Message</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your query in detail..."
                  required
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-ybtBlue"
                />
              </div>
              
              {/* Optional Fields Section */}
              <div className="mt-8 mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <span className="mr-2 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <polyline points="9 11 12 14 22 4"></polyline>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                  </span>
                  Optional but Useful Fields
                </h3>
              </div>
              
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-lg">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="text-lg py-6"
                />
                <p className="text-sm text-gray-500">Helpful for support or sales follow-up</p>
              </div>
              
              {/* Department/Topic Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-lg">Department / Topic</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department" className="text-lg py-6">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="fileUpload" className="text-lg">File Upload</Label>
                <Input
                  id="fileUpload"
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFileAttachment(e.target.files?.[0] || null)}
                  className="text-lg py-6"
                />
                <p className="text-sm text-gray-500">To send screenshots or documents</p>
              </div>
              
              {/* Preferred Contact Time */}
              <div className="space-y-2">
                <Label htmlFor="contactTime" className="text-lg">Preferred Contact Time</Label>
                <Input
                  id="contactTime"
                  value={contactTime}
                  onChange={(e) => setContactTime(e.target.value)}
                  placeholder="e.g. Mornings, Afternoons, Evenings"
                  className="text-lg py-6"
                />
                <p className="text-sm text-gray-500">Useful for scheduling replies</p>
              </div>
              
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-lg">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority" className="text-lg py-6">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-ybtBlue hover:bg-blue-700 text-lg py-6 btn-hover mt-4"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </Card>
          
          {/* Contact Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 animate-scale-in">
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ybtBlue">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone & WhatsApp</p>
                    <p className="text-lg">+91 7903638966</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-lg break-all">codingtutorialsjamshedpur@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-lg">BS-3, Kamal Kunj, Sakchi, Jamshedpur-831001, East Singhbhum, Jharkhand</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 animate-scale-in">
              <h3 className="text-xl font-semibold mb-4">Business Hours</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>Closed</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
