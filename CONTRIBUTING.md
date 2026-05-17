# Contributing to Obsidian IMA Plugin

Thank you for your interest in contributing to the Obsidian IMA Plugin!

## 🤝 How to Contribute

### Reporting Bugs

- Check if the bug has already been reported in [Issues](https://github.com/liuboacean/obsidian-ima-plugin/issues)
- If not, create a new issue with:
  - Clear description of the bug
  - Steps to reproduce
  - Expected vs actual behavior
  - Your environment (OS, Obsidian version, plugin version)

### Suggesting Enhancements

- Open a [Feature Request](https://github.com/liuboacean/obsidian-ima-plugin/issues/new?template=feature_request.md)
- Clearly describe the enhancement and why it would be useful

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🛠️ Development Setup

### Prerequisites

- Node.js v16+
- npm
- Obsidian (for testing)

### Setup

```bash
# Clone your fork
git clone https://github.com/liuboacean/obsidian-ima-plugin.git
cd obsidian-ima-plugin

# Install dependencies
npm install

# Start development (watch mode)
npm run dev

# Build for production
npm run build
```

### Testing

1. Build the plugin: `npm run build`
2. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/obsidian-ima-plugin/` directory
3. Reload Obsidian (`Cmd/Ctrl + R`)
4. Test your changes

### Code Style

- Use TypeScript
- Follow the existing code style
- Add comments for complex logic
- Write meaningful commit messages

## 📝 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 💬 Questions?

Feel free to open an issue for any questions or discussions!

---

Thank you for contributing! 🎉
