#!/usr/bin/env python3
"""
Simple WebSocket client test to verify the WebSocket endpoint is working
"""

import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8001/ws"
    print(f"Testing WebSocket connection to: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Send a test message
            test_message = "Hello from Python client"
            await websocket.send(test_message)
            print(f"📤 Sent: {test_message}")
            
            # Wait for response
            response = await websocket.recv()
            print(f"📥 Received: {response}")
            
            print("✅ WebSocket test completed successfully!")
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔌 Starting WebSocket connection test...")
    success = asyncio.run(test_websocket())
    if success:
        print("✅ WebSocket is working correctly!")
    else:
        print("❌ WebSocket connection failed!")
