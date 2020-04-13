# microfrontends-techniques-exploration
A living explorative example of a straight forward frontend-centric microfrontend architecture.

We define a minimal common set of site-wide in-house dependencies that every page/fragment/_thingy maintained by a team_ can expect to be present and leave the actual implementation decisions of the domain to the teams. The common building blocks will have no external dependencies so total controls stays in-house.

This is an opinionated amalgamation of various approaches to Microfrontends to align with the following _guidelines_:

* No external runtime dependencies for the overall architecture, aside from a small set of polyfills every team can depend on
* All common JavaScript code is baseline IE11 compatible ES5*, no JS compilers allowed - we'll see how we manage minification at a later stage. Consumers of the common building blocks are free to use whatever they are comfortable with as long as communication with external components on the page is solely done with the features the `Core` sandbox provides
* Find the minimal `Core` library necessary for being able to orchestrate artefacts potentially maintained by many teams at once and provide TypeScript definitions for easy usage
* Find the minimal set of common functionality teams can depend on when building their artefacts and provide TypeScript definitions for easy usage
* No server side code, including special routing logic, the website should just work with a static file server
* There will be a curated CSS-only design system in place for visual consistency - the goal is not to have custom CSS but instead leverage utility classes. We may need common logic at some point but we're trying to avoid that right now until we have a better feeling of how the user interaction works out exactly
* CSS by convention will follow tailwindcss naming for being able to drop that in at some point in the future. We might allow some polyfills for IE, we'll see about that, custom properties are a really nice feature for theming...

## Usage
```
git clone https://github.com/mfeineis/microfrontends-techniques-exploration
cd microfrontends-techniques-exploration
npx serve -p 3000
# visit http://localhost:3000
```

## Changelog

### 0.1.0 Add initial setup with routing and SPA page loading

There are bugs all over, this commit only exists to provide a good starting point.

#### Core

All the functionality is backed by a `Core` global (the naming is not final yet) that provides consumers with an isolated sandbox that has these features:
* a basic `console.log` wrapper
* an XMLHttpRequest wrapper not depending on `fetch` or `Promise`
* a basic publish/subscribe api for loosely coupled communication
* a basic wrapper to access `window` and `document`

We might need a way to provide global and local runtime configuration for things like API keys etc. we'll figure this out later.

The plan is that the API of the `Core` global will be frozen in its most minimal state to support the architecture and will never have breaking changes after that. We'll see how that works out over time. It'd probably be wise to think of an easy upgrade path should the `Core` API ever need a breaking change and make that part of the API. The approach is based on [Nicholas Zakas's scalable application architecture](https://www.slideshare.net/nzakas/scalable-javascript-application-architecture/22-Application_ArchitectureModulesSandboxApplication_CoreBase_Library) with the additional assumption that we are now at a point where we don't need a base library other than assuming a standard browser. 

#### Routing

We're using a simple HTML5 `pushState` routing approach that assumes, for now, that all route paths are static (queries need not to be) and that there is a "physical" `index.html` present for every route so we don't have to employ a backend with navigating to every page both dynamically via routing and hard URL GET requests. This approach degrades gracefully while being very powerful.

#### Page Loading

Dynamic page loading is done by listening to routing events and loading page content as `document` using [an adopt-dom technique](https://github.com/mfeineis/microfrontends-adopt-dom-exploration). We only impose a specific minimal set of common page structure and leave the specifics of the actual page to the team working on it. This way every page or fragment can be developed in isolation trivially and it is also easy to assemble them from the outside - possibly using some kind of layout manager, we'll see about that.

#### Styling

We will grow our lackluster in-house "design system" over time, there'll most likely be some basic layout building blocks and a lot of utility classes so teams don't need to write custom CSS.