const Parser = require('rss-parser');
const parser = new Parser({ timeout: 10000, headers: { 'User-Agent': 'TechUpdate/1.0' } });

async function test(name, url) {
  try {
    const feed = await parser.parseURL(url);
    const items = feed.items || [];
    console.log('OK: ' + name + ' (' + items.length + ' items) — ' + (items[0] ? items[0].title : 'no title'));
  } catch(e) {
    console.log('FAIL: ' + name + ' — ' + e.message);
  }
}

(async () => {
  // Java/JDK
  await test('OpenJDK Releases', 'https://github.com/openjdk/jdk/tags.atom');
  await test('Eclipse Temurin', 'https://github.com/adoptium/temurin21-binaries/releases.atom');

  // Rust
  await test('Rust Releases', 'https://github.com/rust-lang/rust/releases.atom');
  await test('Rust Blog', 'https://blog.rust-lang.org/feed.xml');

  // Python
  await test('CPython Releases', 'https://github.com/python/cpython/releases.atom');
  await test('Python Blog', 'https://blog.python.org/feeds/posts/default');

  // Go
  await test('Go Releases', 'https://github.com/golang/go/tags.atom');
  await test('Go Blog', 'https://go.dev/blog/feed.atom');

  // Node.js
  await test('Node.js Releases', 'https://github.com/nodejs/node/releases.atom');
  await test('Node.js Blog', 'https://nodejs.org/en/feed/blog.xml');

  // Maven
  await test('Maven Releases', 'https://github.com/apache/maven/releases.atom');

  // Gradle
  await test('Gradle Releases', 'https://github.com/gradle/gradle/releases.atom');

  // Docker
  await test('Docker Releases', 'https://github.com/moby/moby/releases.atom');
  await test('Docker Blog', 'https://www.docker.com/blog/feed/');

  // Kubernetes
  await test('K8s Releases', 'https://github.com/kubernetes/kubernetes/releases.atom');

  // .NET
  await test('.NET Releases', 'https://github.com/dotnet/runtime/releases.atom');
  await test('.NET Blog', 'https://devblogs.microsoft.com/dotnet/feed/');

  // TypeScript
  await test('TypeScript Releases', 'https://github.com/microsoft/TypeScript/releases.atom');

  // AWS Security Blog
  await test('AWS Security Blog', 'https://aws.amazon.com/blogs/security/feed/');
  await test('AWS Architecture Blog', 'https://aws.amazon.com/blogs/architecture/feed/');
  await test('AWS DevOps Blog', 'https://aws.amazon.com/blogs/devops/feed/');
  await test('AWS Compute Blog', 'https://aws.amazon.com/blogs/compute/feed/');
  await test('AWS Containers Blog', 'https://aws.amazon.com/blogs/containers/feed/');
  await test('AWS Networking Blog', 'https://aws.amazon.com/blogs/networking-and-content-delivery/feed/');
})();
