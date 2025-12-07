/**
 * Distributed File Uploader Component
 * 
 * Handles client-side chunk distribution directly to upload servers,
 * bypassing the main server to prevent memory issues.
 */

import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Upload, Server, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadServer {
  id: string;
  url: string;
  isActive: boolean;
  currentLoad: number;
  maxLoad: number;
  region: string;
  capabilities: {
    maxChunkSize: number;
    supportedFormats: string[];
    dropboxAccounts: number;
    freeSpace: number;
  };
  responseTime: number;
  successRate: number;
}

interface ChunkUploadStatus {
  chunkIndex: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'waiting';
  serverId?: string;
  serverUrl?: string;
  progress: number;
  error?: string;
  attempts: number;
  uploadedAt?: Date;
  dropboxDetails?: {
    accountId: string;
    fileId: string;
    path: string;
  };
}

interface FileUploadState {
  fileId: string;
  fileName: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  chunks: ChunkUploadStatus[];
  overallProgress: number;
  status: 'preparing' | 'distributing' | 'uploading' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
}

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks
const MAX_CONCURRENT_UPLOADS = 20; // Upload 20 chunks simultaneously
const SERVER_SELECTION_TIMEOUT = 30000; // 30 seconds to wait for capable server
const MAX_RETRIES = 3;

export function DistributedFileUploader({ forumId }: { forumId: string }) {
  const [uploadServers, setUploadServers] = useState<UploadServer[]>([]);
  const [fileUpload, setFileUpload] = useState<FileUploadState | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [serverCapabilityCheck, setServerCapabilityCheck] = useState(false);

  // Load available upload servers from main server
  const loadUploadServers = useCallback(async () => {
    try {
      setServerCapabilityCheck(true);
      
      const response = await fetch('/api/upload-servers/available', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to load upload servers');
      
      const data = await response.json();
      setUploadServers(data.servers || []);
      
      console.log(`📡 Loaded ${data.servers?.length || 0} upload servers`);
    } catch (error) {
      console.error('❌ Failed to load upload servers:', error);
    } finally {
      setServerCapabilityCheck(false);
    }
  }, []);

  // Find best capable server for a chunk
  const findOptimalServer = useCallback((chunkSize: number, requirements: { 
    minFreeSpace?: number;
    preferredRegion?: string;
    excludeServers?: string[];
  } = {}) => {
    const availableServers = uploadServers.filter(server => {
      if (!server.isActive) return false;
      if (server.currentLoad >= server.maxLoad) return false;
      if (server.capabilities.maxChunkSize < chunkSize) return false;
      if (requirements.minFreeSpace && server.capabilities.freeSpace < requirements.minFreeSpace) return false;
      if (requirements.excludeServers?.includes(server.id)) return false;
      
      return true;
    });

    if (availableServers.length === 0) return null;

    // Score servers based on multiple factors
    const scoredServers = availableServers.map(server => {
      let score = 0;
      
      // Load balancing (lower load is better)
      score += (1 - (server.currentLoad / server.maxLoad)) * 40;
      
      // Response time (faster is better)
      score += Math.max(0, (1000 - server.responseTime) / 1000) * 30;
      
      // Success rate (higher is better)
      score += server.successRate * 20;
      
      // Free space (more is better)
      score += Math.min(server.capabilities.freeSpace / (1024 * 1024 * 1024), 10) * 10; // GB to score
      
      // Regional preference
      if (requirements.preferredRegion && server.region === requirements.preferredRegion) {
        score += 15;
      }
      
      return { server, score };
    });

    // Sort by score (highest first) and return best server
    scoredServers.sort((a, b) => b.score - a.score);
    return scoredServers[0].server;
  }, [uploadServers]);

  // Wait for capable server with timeout
  const waitForCapableServer = useCallback(async (
    chunkSize: number, 
    requirements: any,
    timeout: number = SERVER_SELECTION_TIMEOUT
  ): Promise<UploadServer | null> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const server = findOptimalServer(chunkSize, requirements);
      if (server) return server;
      
      console.log(`⏳ Waiting for capable server... (${Math.round((timeout - (Date.now() - startTime)) / 1000)}s remaining)`);
      
      // Refresh server status
      await loadUploadServers();
      
      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return null; // Timeout
  }, [findOptimalServer, loadUploadServers]);

  // Upload single chunk to specific server
  const uploadChunkToServer = useCallback(async (
    chunk: Blob,
    chunkIndex: number,
    server: UploadServer,
    fileMetadata: {
      fileId: string;
      fileName: string;
      mimeType: string;
      totalChunks: number;
      forumId: string;
    }
  ): Promise<{
    success: boolean;
    dropboxDetails?: any;
    error?: string;
  }> => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('fileId', fileMetadata.fileId);
    formData.append('fileName', fileMetadata.fileName);
    formData.append('mimeType', fileMetadata.mimeType);
    formData.append('totalChunks', fileMetadata.totalChunks.toString());
    formData.append('forumId', fileMetadata.forumId);

    try {
      const response = await fetch(`${server.url}/upload-chunk`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(300000) // 5 minute timeout
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          dropboxDetails: result.dropboxDetails
        };
      } else {
        return {
          success: false,
          error: result.error || 'Upload failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }, []);

  // Process chunk with retry logic and server selection
  const processChunk = useCallback(async (
    chunkData: Blob,
    chunkIndex: number,
    fileMetadata: any
  ) => {
    const updateChunkStatus = (updates: Partial<ChunkUploadStatus>) => {
      setFileUpload(prev => {
        if (!prev) return prev;
        
        const newChunks = [...prev.chunks];
        const chunkIdx = newChunks.findIndex(c => c.chunkIndex === chunkIndex);
        if (chunkIdx >= 0) {
          newChunks[chunkIdx] = { ...newChunks[chunkIdx], ...updates };
        }
        
        // Calculate overall progress
        const completedChunks = newChunks.filter(c => c.status === 'completed').length;
        const overallProgress = (completedChunks / newChunks.length) * 100;
        
        return {
          ...prev,
          chunks: newChunks,
          overallProgress
        };
      });
    };

    let attempts = 0;
    let excludeServers: string[] = [];

    while (attempts < MAX_RETRIES) {
      attempts++;
      
      // Update status to waiting for server
      updateChunkStatus({ 
        status: 'waiting', 
        attempts,
        progress: 0 
      });

      // Find or wait for capable server
      console.log(`🔍 Finding server for chunk ${chunkIndex} (attempt ${attempts})`);
      
      let server = findOptimalServer(chunkData.size, { 
        minFreeSpace: chunkData.size * 2, // Need 2x space for processing
        excludeServers 
      });

      if (!server) {
        console.log(`⏳ No capable server available, waiting...`);
        updateChunkStatus({ status: 'waiting' });
        
        server = await waitForCapableServer(chunkData.size, { 
          minFreeSpace: chunkData.size * 2,
          excludeServers 
        });
      }

      if (!server) {
        console.error(`❌ No capable server found for chunk ${chunkIndex} after timeout`);
        updateChunkStatus({ 
          status: 'failed', 
          error: 'No capable server available',
          progress: 0
        });
        return;
      }

      // Start upload
      console.log(`📤 Uploading chunk ${chunkIndex} to server ${server.id} (${server.url})`);
      updateChunkStatus({ 
        status: 'uploading', 
        serverId: server.id,
        serverUrl: server.url,
        progress: 0
      });

      // Upload chunk
      const result = await uploadChunkToServer(chunkData, chunkIndex, server, fileMetadata);

      if (result.success) {
        console.log(`✅ Chunk ${chunkIndex} uploaded successfully to ${server.id}`);
        updateChunkStatus({ 
          status: 'completed',
          progress: 100,
          uploadedAt: new Date(),
          dropboxDetails: result.dropboxDetails
        });
        return; // Success!
      } else {
        console.error(`❌ Chunk ${chunkIndex} failed on server ${server.id}: ${result.error}`);
        
        // Add server to exclude list for next attempt
        excludeServers.push(server.id);
        
        updateChunkStatus({ 
          status: 'failed',
          error: result.error,
          progress: 0
        });

        // Wait before retry
        if (attempts < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    // All retries failed
    console.error(`💥 Chunk ${chunkIndex} failed after ${MAX_RETRIES} attempts`);
    updateChunkStatus({ 
      status: 'failed',
      error: `Failed after ${MAX_RETRIES} attempts`
    });
  }, [findOptimalServer, waitForCapableServer, uploadChunkToServer]);

  // Main file upload function
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || uploadServers.length === 0) {
      alert('Please load upload servers first');
      return;
    }

    // Check file size limit (10MB maximum)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the maximum limit of 10MB`);
      return;
    }

    setIsUploading(true);
    
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // Initialize upload state
    const uploadState: FileUploadState = {
      fileId,
      fileName: file.name,
      totalSize: file.size,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      chunks: Array.from({ length: totalChunks }, (_, i) => ({
        chunkIndex: i,
        status: 'pending',
        progress: 0,
        attempts: 0
      })),
      overallProgress: 0,
      status: 'preparing',
      startTime: new Date()
    };

    setFileUpload(uploadState);

    try {
      console.log(`🚀 Starting distributed upload: ${file.name} (${totalChunks} chunks)`);
      
      // Update status to distributing
      setFileUpload(prev => prev ? { ...prev, status: 'distributing' } : null);
      
      // Create file metadata for upload servers
      const fileMetadata = {
        fileId,
        fileName: file.name,
        mimeType: file.type,
        totalChunks,
        forumId
      };

      // Process chunks in batches to manage concurrency
      const batchSize = MAX_CONCURRENT_UPLOADS;
      
      setFileUpload(prev => prev ? { ...prev, status: 'uploading' } : null);

      for (let batchStart = 0; batchStart < totalChunks; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, totalChunks);
        const batchPromises = [];

        console.log(`📦 Processing batch ${Math.floor(batchStart/batchSize) + 1}/${Math.ceil(totalChunks/batchSize)} (chunks ${batchStart}-${batchEnd-1})`);

        for (let i = batchStart; i < batchEnd; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);

          batchPromises.push(processChunk(chunkBlob, i, fileMetadata));
        }

        // Wait for current batch to complete
        await Promise.all(batchPromises);
        
        // Brief pause between batches
        if (batchEnd < totalChunks) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Check final status
      setFileUpload(prev => {
        if (!prev) return prev;
        
        const completedChunks = prev.chunks.filter(c => c.status === 'completed').length;
        const failedChunks = prev.chunks.filter(c => c.status === 'failed').length;
        
        const finalStatus = completedChunks === totalChunks ? 'completed' : 'failed';
        
        console.log(`🏁 Upload ${finalStatus}: ${completedChunks}/${totalChunks} chunks successful, ${failedChunks} failed`);
        
        return {
          ...prev,
          status: finalStatus,
          endTime: new Date()
        };
      });

    } catch (error) {
      console.error('💥 Upload process failed:', error);
      setFileUpload(prev => prev ? { ...prev, status: 'failed', endTime: new Date() } : null);
    } finally {
      setIsUploading(false);
    }
  }, [uploadServers, forumId, processChunk]);

  // Load servers on mount
  React.useEffect(() => {
    loadUploadServers();
  }, [loadUploadServers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'uploading': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'waiting': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'uploading': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'waiting': return <Clock className="w-4 h-4" />;
      default: return <Upload className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Server Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Upload Servers
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadUploadServers}
              disabled={serverCapabilityCheck}
            >
              {serverCapabilityCheck ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadServers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No upload servers available. Please add servers to the system first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{uploadServers.filter(s => s.isActive).length}</div>
                <div className="text-sm text-gray-600">Active Servers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{uploadServers.length}</div>
                <div className="text-sm text-gray-600">Total Servers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(uploadServers.reduce((sum, s) => sum + s.successRate, 0) / uploadServers.length || 0)}%
                </div>
                <div className="text-sm text-gray-600">Avg Success Rate</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Distributed File Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              disabled={isUploading || uploadServers.length === 0}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
          </div>

          {fileUpload && (
            <div className="space-y-4">
              {/* Overall Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{fileUpload.fileName}</span>
                  <span>{Math.round(fileUpload.overallProgress)}%</span>
                </div>
                <Progress value={fileUpload.overallProgress} />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Status: {fileUpload.status}</span>
                  <span>{fileUpload.chunks.filter(c => c.status === 'completed').length}/{fileUpload.totalChunks} chunks</span>
                </div>
              </div>

              {/* Chunk Details */}
              {fileUpload.chunks.length <= 20 && (
                <div>
                  <h4 className="font-medium mb-2">Chunk Status:</h4>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
                    {fileUpload.chunks.map((chunk) => (
                      <div
                        key={chunk.chunkIndex}
                        className={`p-1 text-xs rounded text-center ${getStatusColor(chunk.status)} border`}
                        title={`Chunk ${chunk.chunkIndex}: ${chunk.status}${chunk.serverId ? ` on ${chunk.serverId}` : ''}${chunk.error ? ` - ${chunk.error}` : ''}`}
                      >
                        <div className="flex items-center justify-center">
                          {getStatusIcon(chunk.status)}
                        </div>
                        <div>{chunk.chunkIndex}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <Badge variant="secondary">{fileUpload.chunks.filter(c => c.status === 'pending').length}</Badge>
                  <div>Pending</div>
                </div>
                <div className="text-center">
                  <Badge variant="default">{fileUpload.chunks.filter(c => c.status === 'uploading').length}</Badge>
                  <div>Uploading</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline">{fileUpload.chunks.filter(c => c.status === 'completed').length}</Badge>
                  <div>Completed</div>
                </div>
                <div className="text-center">
                  <Badge variant="destructive">{fileUpload.chunks.filter(c => c.status === 'failed').length}</Badge>
                  <div>Failed</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}