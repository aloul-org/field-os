import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api_client.dart';
import '../../theme/tokens.dart';
import '../auth/session_controller.dart';
import '../estimates/estimate_service.dart';

/// The home screen. Deliberately one job: ask the user to describe anything and
/// turn it into a priced estimate. Everything else in the product lives behind
/// the nav — this screen stays a single prompt, per the product brief that
/// estimating is the headline feature.
class EstimateHomeScreen extends ConsumerStatefulWidget {
  const EstimateHomeScreen({super.key});

  @override
  ConsumerState<EstimateHomeScreen> createState() => _EstimateHomeScreenState();
}

class _EstimateHomeScreenState extends ConsumerState<EstimateHomeScreen> {
  final _input = TextEditingController();
  final _picker = ImagePicker();
  final List<EstimateImage> _images = [];
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    // Enables/disables the submit button as the user types.
    _input.addListener(_onChanged);
  }

  void _onChanged() => setState(() {});

  @override
  void dispose() {
    _input.removeListener(_onChanged);
    _input.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      !_busy && (_input.text.trim().isNotEmpty || _images.isNotEmpty);

  Future<void> _addPhoto(ImageSource source) async {
    if (_images.length >= EstimateService.maxImages) return;
    final file = await _picker.pickImage(
      source: source,
      // The photo is base64'd into a JSON body and sent to a vision model —
      // full-resolution camera output would bloat the request for no gain.
      maxWidth: 1600,
      imageQuality: 82,
    );
    if (file == null) return;

    final bytes = await file.readAsBytes();
    if (!mounted) return;
    setState(() {
      _images.add(EstimateImage(
        bytes: bytes,
        mediaType: file.mimeType ?? 'image/jpeg',
      ));
    });
  }

  Future<void> _submit() async {
    if (!_canSubmit) return;
    setState(() => _busy = true);

    try {
      final draft = await ref.read(estimateServiceProvider).extract(
            description: _input.text,
            images: _images,
          );
      if (!mounted) return;
      context.push('/estimates/draft', extra: draft);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final ctx = ref.watch(activeContextProvider).valueOrNull;
    final firstName = ctx?.memberName.split(' ').first;

    return Scaffold(
      body: SafeArea(
        child: GestureDetector(
          onTap: () => FocusScope.of(context).unfocus(),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: Alignment.centerRight,
                  child: IconButton(
                    icon: Icon(Icons.menu_rounded, color: c.mutedForeground),
                    onPressed: () => Scaffold.of(context).openEndDrawer(),
                    tooltip: 'Menu',
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  firstName == null ? 'What are we quoting?' : 'Hi $firstName',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.8,
                    color: c.foreground,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Describe any job and I\'ll price it up.',
                  style: TextStyle(fontSize: 16.5, color: c.mutedForeground),
                ),
                const SizedBox(height: 26),
                _PromptField(controller: _input, enabled: !_busy),
                if (_images.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  _PhotoStrip(
                    images: _images,
                    onRemove: (i) => setState(() => _images.removeAt(i)),
                  ),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    _PhotoButton(
                      icon: Icons.photo_camera_outlined,
                      label: 'Camera',
                      enabled: !_busy && _images.length < EstimateService.maxImages,
                      onTap: () => _addPhoto(ImageSource.camera),
                    ),
                    const SizedBox(width: 10),
                    _PhotoButton(
                      icon: Icons.image_outlined,
                      label: 'Photos',
                      enabled: !_busy && _images.length < EstimateService.maxImages,
                      onTap: () => _addPhoto(ImageSource.gallery),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _canSubmit ? _submit : null,
                  child: _busy
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: c.mutedForeground,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text('Pricing it up…'),
                          ],
                        )
                      : const Text('Create estimate'),
                ),
                const SizedBox(height: 28),
                if (!_busy && _input.text.isEmpty && _images.isEmpty)
                  _Examples(onPick: (text) {
                    _input.text = text;
                    _input.selection = TextSelection.fromPosition(
                      TextPosition(offset: text.length),
                    );
                  }),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PromptField extends StatelessWidget {
  const _PromptField({required this.controller, required this.enabled});

  final TextEditingController controller;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      enabled: enabled,
      maxLines: 6,
      minLines: 4,
      autofocus: true,
      textCapitalization: TextCapitalization.sentences,
      style: const TextStyle(fontSize: 16, height: 1.45),
      decoration: const InputDecoration(
        hintText:
            'e.g. Replace a leaking radiator valve in a first-floor bedroom, '
            'plus bleed three other radiators.',
      ),
    );
  }
}

class _PhotoButton extends StatelessWidget {
  const _PhotoButton({
    required this.icon,
    required this.label,
    required this.enabled,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Expanded(
      child: OutlinedButton.icon(
        onPressed: enabled ? onTap : null,
        icon: Icon(icon, size: 19),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(46),
          foregroundColor: c.foreground,
        ),
      ),
    );
  }
}

class _PhotoStrip extends StatelessWidget {
  const _PhotoStrip({required this.images, required this.onRemove});

  final List<EstimateImage> images;
  final void Function(int index) onRemove;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 76,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, i) => Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(FieldRadius.md),
              child: Image.memory(
                images[i].bytes,
                height: 76,
                width: 76,
                fit: BoxFit.cover,
              ),
            ),
            Positioned(
              top: 2,
              right: 2,
              child: GestureDetector(
                onTap: () => onRemove(i),
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close,
                      size: 13, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Example prompts, shown only on the empty state so they never crowd the field
/// once the user starts typing.
class _Examples extends StatelessWidget {
  const _Examples({required this.onPick});

  final void Function(String text) onPick;

  static const _samples = [
    'Boiler service and safety check on a 3-bed semi',
    'Replace 2 cracked roof tiles and reseal a flashing',
    'Install 4 double sockets in a home office',
  ];

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Try one of these',
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: c.mutedForeground,
            letterSpacing: 0.2,
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _samples
              .map((s) => GestureDetector(
                    onTap: () => onPick(s),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 13, vertical: 9),
                      decoration: BoxDecoration(
                        color: c.accent,
                        borderRadius:
                            BorderRadius.circular(FieldRadius.pill),
                        border: Border.all(
                            color: c.primary.withOpacity(0.18)),
                      ),
                      child: Text(
                        s,
                        style: TextStyle(
                          fontSize: 13,
                          color: c.accentForeground,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ))
              .toList(),
        ),
      ],
    );
  }
}
