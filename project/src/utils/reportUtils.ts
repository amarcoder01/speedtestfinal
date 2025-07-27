import { SpeedTestResult } from '../types/speedTest';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePDFReport = async (result: SpeedTestResult, qrCodeDataUrl?: string) => {
  try {
    // Create a new PDF document with better quality settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15; // mm

    // Header with modern gradient effect
    pdf.setFillColor(59, 130, 246); // Blue base
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setFillColor(79, 70, 229); // Indigo accent
    pdf.rect(pageWidth - 35, 0, 35, 35, 'F');
    
    // Add logo-like element
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.circle(25, 17.5, 7, 'S');
    pdf.line(32, 17.5, 37, 17.5);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('SpeedTest Pro Report', 45, 20);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Generated on ${new Date(result.timestamp).toLocaleString()}`, 45, 27);

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // Results section with visual elements
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55); // Dark gray
    pdf.text('Test Results', margin, 45);

    // Draw result boxes with colored backgrounds - 2x2 grid for better layout
    const boxWidth = (pageWidth - (margin * 3)) / 2;
    const boxHeight = 25;
    const boxY = 50;
    
    // Download box
    pdf.setFillColor(209, 250, 229); // Light green
    pdf.roundedRect(margin, boxY, boxWidth, boxHeight, 3, 3, 'F');
    pdf.setTextColor(16, 185, 129); // Green
    pdf.setFontSize(18);
    pdf.text(`${result.downloadSpeed.toFixed(1)} Mbps`, margin + 5, boxY + 15);
    pdf.setTextColor(6, 95, 70); // Dark green
    pdf.setFontSize(12);
    pdf.text('Download', margin + 5, boxY + 8);
    
    // Upload box
    pdf.setFillColor(219, 234, 254); // Light blue
    pdf.roundedRect(margin * 2 + boxWidth, boxY, boxWidth, boxHeight, 3, 3, 'F');
    pdf.setTextColor(37, 99, 235); // Blue
    pdf.setFontSize(18);
    pdf.text(`${result.uploadSpeed.toFixed(1)} Mbps`, margin * 2 + boxWidth + 5, boxY + 15);
    pdf.setTextColor(30, 58, 138); // Dark blue
    pdf.setFontSize(12);
    pdf.text('Upload', margin * 2 + boxWidth + 5, boxY + 8);
    
    // Ping box
    pdf.setFillColor(254, 226, 226); // Light red
    pdf.roundedRect(margin, boxY + boxHeight + 5, boxWidth, boxHeight, 3, 3, 'F');
    pdf.setTextColor(220, 38, 38); // Red
    pdf.setFontSize(18);
    pdf.text(`${result.ping.toFixed(0)} ms`, margin + 5, boxY + boxHeight + 20);
    pdf.setTextColor(127, 29, 29); // Dark red
    pdf.setFontSize(12);
    pdf.text('Ping', margin + 5, boxY + boxHeight + 13);
    
    // Jitter box
    pdf.setFillColor(254, 243, 199); // Light yellow
    pdf.roundedRect(margin * 2 + boxWidth, boxY + boxHeight + 5, boxWidth, boxHeight, 3, 3, 'F');
    pdf.setTextColor(217, 119, 6); // Yellow
    pdf.setFontSize(18);
    pdf.text(`${result.jitter.toFixed(1)} ms`, margin * 2 + boxWidth + 5, boxY + boxHeight + 20);
    pdf.setTextColor(146, 64, 14); // Dark yellow
    pdf.setFontSize(12);
    pdf.text('Jitter', margin * 2 + boxWidth + 5, boxY + boxHeight + 13);

    // Additional details section
    pdf.setFillColor(243, 244, 246); // Light gray
    pdf.roundedRect(margin, boxY + (boxHeight * 2) + 15, pageWidth - (margin * 2), 35, 3, 3, 'F');
    
    pdf.setTextColor(31, 41, 55); // Dark gray
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Additional Details', margin + 5, boxY + (boxHeight * 2) + 25);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99); // Medium gray
    const details = [
      `Server Location: ${result.serverLocation}`,
      `Test Duration: ${result.testDuration.toFixed(1)} seconds`,
      `Test Date: ${new Date(result.timestamp).toLocaleDateString()}`,
      `User Location: ${result.userLocation.city}, ${result.userLocation.country}`
    ];

    details.forEach((text, index) => {
      pdf.text(text, margin + 5, boxY + (boxHeight * 2) + 35 + (index * 8));
    });

    // Performance analysis with colored sections
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55); // Dark gray
    pdf.text('Performance Analysis', margin, boxY + (boxHeight * 2) + 60);

    // Analysis boxes
    const analysisY = boxY + (boxHeight * 2) + 65;
    
    // Download analysis
    const downloadColor = result.downloadSpeed > 25 ? '#10B981' : result.downloadSpeed > 10 ? '#FBBF24' : '#EF4444';
    pdf.setDrawColor(downloadColor);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin, analysisY, pageWidth - (margin * 2), 20, 3, 3, 'S');
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const downloadAnalysis = `Your download speed of ${result.downloadSpeed.toFixed(1)} Mbps is ${result.downloadSpeed > 25 ? 'excellent' : result.downloadSpeed > 10 ? 'good' : 'below average'} for most online activities.`;
    const downloadLines = pdf.splitTextToSize(downloadAnalysis, pageWidth - (margin * 2) - 10);
    pdf.text(downloadLines, margin + 5, analysisY + 10);
    
    // Upload analysis
    const uploadColor = result.uploadSpeed > 10 ? '#10B981' : result.uploadSpeed > 5 ? '#FBBF24' : '#EF4444';
    pdf.setDrawColor(uploadColor);
    pdf.roundedRect(margin, analysisY + 25, pageWidth - (margin * 2), 20, 3, 3, 'S');
    
    const uploadAnalysis = `Upload speed of ${result.uploadSpeed.toFixed(1)} Mbps is ${result.uploadSpeed > 10 ? 'excellent' : result.uploadSpeed > 5 ? 'suitable' : 'limited'} for video conferencing and file sharing.`;
    const uploadLines = pdf.splitTextToSize(uploadAnalysis, pageWidth - (margin * 2) - 10);
    pdf.text(uploadLines, margin + 5, analysisY + 35);
    
    // Ping analysis
    const pingColor = result.ping < 20 ? '#10B981' : result.ping < 50 ? '#FBBF24' : '#EF4444';
    pdf.setDrawColor(pingColor);
    pdf.roundedRect(margin, analysisY + 50, pageWidth - (margin * 2), 20, 3, 3, 'S');
    
    const pingAnalysis = `Ping of ${result.ping.toFixed(0)}ms indicates ${result.ping < 20 ? 'excellent' : result.ping < 50 ? 'good' : 'poor'} responsiveness for gaming and real-time applications.`;
    const pingLines = pdf.splitTextToSize(pingAnalysis, pageWidth - (margin * 2) - 10);
    pdf.text(pingLines, margin + 5, analysisY + 60);
    
    // Jitter analysis
    const jitterColor = result.jitter < 5 ? '#10B981' : result.jitter < 15 ? '#FBBF24' : '#EF4444';
    pdf.setDrawColor(jitterColor);
    pdf.roundedRect(margin, analysisY + 75, pageWidth - (margin * 2), 20, 3, 3, 'S');
    
    const jitterAnalysis = `Jitter of ${result.jitter.toFixed(1)}ms indicates ${result.jitter < 5 ? 'excellent' : result.jitter < 15 ? 'acceptable' : 'poor'} connection stability for streaming and video calls.`;
    const jitterLines = pdf.splitTextToSize(jitterAnalysis, pageWidth - (margin * 2) - 10);
    pdf.text(jitterLines, margin + 5, analysisY + 85);

    // Footer with gradient
    pdf.setFillColor(243, 244, 246); // Light gray
    pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    
    pdf.setTextColor(107, 114, 128); // Gray
    pdf.setFontSize(8);
    pdf.text('Generated by SpeedTest Pro - Privacy-focused speed testing', margin, pageHeight - 15);
    pdf.text('No personal data collected or stored', margin, pageHeight - 10);
    pdf.text(`Report ID: ${result.id}`, margin, pageHeight - 5);

    // Add QR code if available
    if (qrCodeDataUrl) {
      try {
        pdf.addImage(qrCodeDataUrl, 'PNG', pageWidth - 35, pageHeight - 35, 25, 25);
        pdf.setFontSize(7);
        pdf.text('Scan to view results', pageWidth - 35, pageHeight - 5);
      } catch (qrError) {
        console.log('Error adding QR code to PDF', qrError);
      }
    } else {
      // Try to find QR code in the DOM as fallback
      try {
        const qrElement = document.querySelector('.bg-white.border.border-gray-200.rounded-lg img');
        if (qrElement) {
          const qrDataUrl = (qrElement as HTMLImageElement).src;
          pdf.addImage(qrDataUrl, 'PNG', pageWidth - 35, pageHeight - 35, 25, 25);
          pdf.setFontSize(7);
          pdf.text('Scan to view results', pageWidth - 35, pageHeight - 5);
        }
      } catch (qrError) {
        console.log('QR code not available for PDF', qrError);
      }
    }

    // Save the PDF
    pdf.save(`speedtest-report-${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};