---
layout: main-wrapper.njk
title: Resonite Systems Manager
permalink: /Systems_Manager/
eleventyNavigation:
   key: SystemsManager
   parent: Stuff
---

# {{ title }}
A Easy to use, modular and expandable UI for managing Systems on Tools, Items, Avatars, Worlds… So basically anything.


## Concept / Idea
We have had Modular Items / Tools before. But all of them use a bespoke system for managing, viewing, installing and uninstalling. This UI and backend seeks to be a universal way of doing that.
- A lot of the way how systems work is inspired by how Avatar Standard handles Systems.
- The manager was born, out of the desire of a more familiar and expandable UX for managing Systems on my avatar.
- I decided that this would be useful for more than just Avatars. So I started writing a Standards proposal while building the manager.

## Features
### Current
- Viewing Systems installed on a hierarchy
  - Supports multiple formats:
    - [Systems Standard](https://wiki.resonite.com/User:Mint_Shock/System_Standard)
    - [Avatar Standard](https://wiki.resonite.com/Avatar_standard)
    - All slots under the “Systems" slot also get assumed to be Systems.
- Finding the “Systems" Slot on a given hierarchy that contains installed systems.
- Transfer actions: 
  - Install
  - Copy
  - Eject
  - Destroy
- Export Systems in the form of a orb that can be easily shared with others.
  - Either my own format of Orbs
  - Or generic ones
    - For example the ones created by ColinTheCat’s AvatarStandard tool
    - This will search for a direct child slot of the orb named: "Systems"
- Inspecting Systems and viewing information about them.
- Clean, Intuitive Ui
- VR and desktop optimized
  - The install visual reacts to the presence of a installable or by growing in size, which makes it a lot easier to insert them in desktop mode
- Some nice to have features for creators: 
  - grab the name of a system from the list, to get a reference to it.

### Planned
For planned Features and issues see the [GitHub repository](https://github.com/Mint-Shock/Systems-Manager/issues) issues page.

**Big Planned Features:**
- Tree view rework [WIP]
- Unified message/Logging/Error system
  - Will allow Installed Systems to notify the manager of potential issues like:
    - Version conflicts
    - Debugging messages
    - missing references
    - missing dependencies
- Better handling for installing Systems as subsystems
- Version Checking
- Unified way for Systems to have settings
  - Will probably be implemented as part of the inspector ui

## Technical Details
- Built with: Moduprint. I’d recommend also using it when viewing the flux to be able to see comments.
- The manager currently breaks if duplicated. Please always spawn a clean one from the folder instead and upvote this GitHub issue: https://github.com/Yellow-Dog-Man/Resonite-Issues/issues/3148
- Performance notes:
  - Can be a bit heavy, especially when generating the list view for a lot of Systems.
  - Also uses a lot of dynamic variables. This can cause a slight lag spike in some cases when spawned due to all of the Dynvars needing to bind to their spaces.

## Compatibility / Integrations
> [!warn]- This is a alpha version!!!

what does that mean?
- Anything that tries to integrate with the manager at this early stage of development, will likely break in the future.
- I do not commit to not making breaking changes while this is in Alpha and Beta phase.
- I will try to not break existing stuff too badly, but if it benefits the Manager in the long run, then I’ll make changes to its internal structure without explicitly adding backwards compatibility.
- This will change, once it’s out of Beta though. Then I’ll try my best to keep everything backwards compatible.

## Bug Reports / Feedback
Currently I only take Ideas and suggestions.
In the future I’ll be open to others helping maintain and improve Subsystems and have those merged.
