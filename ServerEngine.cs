using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

public class FastServer {
    private TcpListener _listener;
    private string _rootDir;
    private bool _running;

    public void Start(int port, string rootDir) {
        _rootDir = rootDir;
        _running = true;
        _listener = new TcpListener(IPAddress.Any, port);
        _listener.Start();

        while (_running) {
            try {
                TcpClient client = _listener.AcceptTcpClient();
                ThreadPool.QueueUserWorkItem(HandleClient, client);
            } catch {
                if (!_running) break;
            }
        }
    }

    public void Stop() {
        _running = false;
        try { _listener.Stop(); } catch {}
    }

    private void HandleClient(object obj) {
        TcpClient client = (TcpClient)obj;
        try {
            client.ReceiveTimeout = 4000;
            client.SendTimeout = 4000;
            using (NetworkStream stream = client.GetStream()) {
                byte[] buffer = new byte[8192];
                int bytesRead = stream.Read(buffer, 0, buffer.Length);
                if (bytesRead <= 0) return;

                string reqText = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                string[] lines = reqText.Split(new string[] { "\r\n", "\n" }, StringSplitOptions.None);
                if (lines.Length == 0) return;

                string[] tokens = lines[0].Split(' ');
                if (tokens.Length < 2) return;

                string rawPath = tokens[1].Split('?')[0];
                if (string.IsNullOrEmpty(rawPath) || rawPath == "/") {
                    rawPath = "/index.html";
                }

                string cleanPath = rawPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                string filePath = Path.Combine(_rootDir, cleanPath);

                if (File.Exists(filePath)) {
                    string ext = Path.GetExtension(filePath).ToLowerInvariant();
                    string contentType = "application/octet-stream";
                    switch (ext) {
                        case ".html":
                        case ".htm": contentType = "text/html; charset=utf-8"; break;
                        case ".css": contentType = "text/css; charset=utf-8"; break;
                        case ".js": contentType = "application/javascript; charset=utf-8"; break;
                        case ".json": contentType = "application/json; charset=utf-8"; break;
                        case ".svg": contentType = "image/svg+xml"; break;
                        case ".png": contentType = "image/png"; break;
                        case ".jpg":
                        case ".jpeg": contentType = "image/jpeg"; break;
                        case ".gif": contentType = "image/gif"; break;
                        case ".ico": contentType = "image/x-icon"; break;
                        case ".woff": contentType = "font/woff"; break;
                        case ".woff2": contentType = "font/woff2"; break;
                    }

                    byte[] fileBytes = File.ReadAllBytes(filePath);
                    string headers = "HTTP/1.1 200 OK\r\n" +
                                     "Content-Type: " + contentType + "\r\n" +
                                     "Content-Length: " + fileBytes.Length + "\r\n" +
                                     "Access-Control-Allow-Origin: *\r\n" +
                                     "Cache-Control: no-cache, no-store, must-revalidate\r\n" +
                                     "Connection: close\r\n\r\n";
                    byte[] headerBytes = Encoding.UTF8.GetBytes(headers);
                    stream.Write(headerBytes, 0, headerBytes.Length);
                    stream.Write(fileBytes, 0, fileBytes.Length);
                    stream.Flush();
                } else {
                    byte[] notFoundBytes = Encoding.UTF8.GetBytes("HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found");
                    stream.Write(notFoundBytes, 0, notFoundBytes.Length);
                    stream.Flush();
                }
            }
        } catch {
            // Drop connection gracefully
        } finally {
            try { client.Close(); } catch {}
        }
    }
}
