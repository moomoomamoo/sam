import { Component, HostListener, ViewChild, ElementRef, NgZone } from '@angular/core';

import { DragulaService } from 'ng2-dragula';

import * as firebase from "firebase/app";

import * as dragula from 'dragula';
import { AppService } from '../app.service';

declare var M;

export interface TagElement {
	text: string;
	href?: string;
}

export interface Tag {
	text: string;
	elements: TagElement[];
}

export interface DBProject {
	text: string; // Dispaly text
	href: string; // Href on click
	useSlideshow: boolean; // Use slideshow instead of href on click
	imageUrls: string[];
	desc: string;
	tags: Tag[];
}

export interface Project extends DBProject {
	width: number; // Width of text
	margin: number; // ?
	marginRight: number; // ?
}

@Component({
    selector: 'moo-home',
    templateUrl: './home.template.html',
    styleUrls: ['./home.style.scss']
})
export class HomeComponent {
	PROJECTS = "PROJECTS";
	Footers = "FOOTERS";
	
	@ViewChild("linksContainer") linksContainer: ElementRef;

	@ViewChild("centerButton") centerButton: ElementRef;

	mode: string;
	modeTimeout: any;

	showOthers: boolean;

	projectFontSize: number;

	projectRows: Project[][];

	projectsMaxWidth: number;
	maxProjects: number;

	h: number;
	w: number;

	showPoem: boolean;

	loading: boolean;
	saving: boolean;

	email: string;
	password: string;

	showLogin: boolean;
	loggedIn: boolean;

	dragging: boolean;

	showManagement: boolean;

	toggleModeTimeout: any;

	activeManagementOption: string = 'projects';

	authPending: boolean;

	isInvalidUrl: (text: string) => string;
	isEmptyProject: (text: string) => string;
	isEmptyFooter: (text: string) => string;

	exampleText: string = "How now brown cow?\\sSAMANTHAMINK\\nBODYOFWORK";

	slideshow: boolean;
	showSlideshow: boolean;
	slideshowAnimate: boolean;
	slideshowAnimateTimeout: any;

	selectedFont: string;

	test: boolean;

	imageIndex: number;

	hMargin: number;
	wMargin: number;

	activeProject: Project;

	started: boolean;

	constructor(private dragulaService: DragulaService, private ngZone: NgZone, public appService: AppService) {
	}

	_ripple(x: number, y: number) {
		const W = (window as any).Waves;

		W.ripple(this.centerButton.nativeElement, {
			wait: 200,
			position: {
				x: x,
				y: y
			}
		});
	}

	clickMe() {
		if (this.started) {
			return;
		}

		if (!(window as any).Waves || !(window as any).Waves.ripple) {
			return;
		}

		const W = (window as any).Waves;

		const width = this.centerButton && this.centerButton.nativeElement && this.centerButton.nativeElement.clientWidth;

		if (width) {
			const x = width * Math.random();
			const y = width * Math.random();

			this._ripple(x, y);
			setTimeout(() => {
				const x = width * 1 / 3 + 2 * width * Math.random() / 3;
				const y = width * 1 / 3 + 2 * width * Math.random() / 3;

				this._ripple(x, y);
			}, 100);
			setTimeout(() => {
				// const x = width * 2 / 3 + 1 * width * Math.random() / 3;
				// const y = width * 2 / 3 + 1 * width * Math.random() / 3;

				this._ripple(12, 12);
			}, 200);
			// setTimeout(() => {
			// 	this._ripple((x + 12) % 24, (y + 12) % 24);
			// }, 450);
		}

		setTimeout(() => {
			this.clickMe();
		}, 2000);
	}

	ngOnInit() {
		const mode = this.appService.mode;//'dark';

		if (mode === 'dark') {
			this.setMode('dark');
			this.showOthers = true;
		} else if (mode === 'light') {
			this.setMode('light');
		} else {
			this.setMode('');
		}

		// this.test = true;

		this.maxProjects = 99;

		this.projectRows = [[]];

		this.hMargin = 100;
		this.wMargin = 100;

		this.imageIndex = 0;

		(window as any).home = this;
		(window as any).firebase = firebase;
		// const drake = dragula([document.querySelector('#drakeTest')], {
		// 	// moves: function (el, source, handle, sibling) {
		// 	// 	console.log("moo");
		// 	// 	// return true; // elements are always draggable by default
		// 	// 	return false; // elements are always draggable by default
		// 	// },
		// 	moves: function (el, source, handle, sibling) {
		// 		console.log("moves");
		// 		return false; // elements are always draggable by default
		// 	},
		// 	invalid: function(el, handle) {
		// 		console.log("invalid");
		// 		return true;
		// 	},
		// 	ignoreInputTextSelection: false
		// });
		// console.log(drake);
		// setTimeout(() => {
		// console.log(drake.dragging);

		// }, 5000);

		this.isEmptyProject = (text: string) => {
			if (!text) {
				return "Project name is blank";
			}
		};

		this.isEmptyFooter = (text: string) => {
			if (!text) {
				return "Footer item is blank";
			}
		};

		this.isInvalidUrl = (text: string) => {
			let firstCheckPassed = false;

			const invalidMessage = "Invalid url";

			if (!text) {
				return;
			}

			if (!firstCheckPassed && text.indexOf('https:') === 0) {
				firstCheckPassed = true;
			}
			
			if (!firstCheckPassed && text.indexOf('http:') === 0) {
				firstCheckPassed = true;
			}
			
			if (!firstCheckPassed && text.indexOf('mailto:') === 0) {
				firstCheckPassed = true;
			}
			
			if (!firstCheckPassed && text.indexOf('tel:') === 0) {
				firstCheckPassed = true;
			}

			if (!firstCheckPassed) {
				return invalidMessage;
			}

			try {
				new URL(text);
			} catch (error) {
				return invalidMessage;
			}
		};

		this.authHandler();
	}

	nextImage() {
		this.imageIndex += 1;
		if (this.imageIndex > this.activeProject.imageUrls.length - 1) {
			this.imageIndex = 0;
		}
	}

	backImage() {
		this.imageIndex -= 1;
		if (this.imageIndex < 0) {
			this.imageIndex = this.activeProject.imageUrls.length - 1;
		}
	}

	toggleSlideshow(event?: Event, activeProject?: Project) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.activeProject = activeProject;

		console.log('toggleSlideshow');
		if (this.mode === 'light') {
			this.toggleMode();
		}

		this.slideshow = !this.slideshow;

		if (this.slideshow) {
			this.imageIndex = 0;
			this.slideshowAnimate = true;
			clearTimeout(this.slideshowAnimateTimeout);
			this.slideshowAnimateTimeout = setTimeout(() => {
				this.slideshowAnimate = false;
				this.showSlideshow = true;
			}, 500);
		} else {
			this.showSlideshow = false;
			setTimeout(() => {
					this.recalcEvertyhing();
			}, 1);
			this.slideshowAnimate = true;
			clearTimeout(this.slideshowAnimateTimeout);
			this.slideshowAnimateTimeout = setTimeout(() => {
				this.slideshowAnimate = false;
			}, 1000);
		}
	}

	titleFunc(event: MouseEvent) {
		if (this.slideshow) {
			this.toggleSlideshow();
			event.preventDefault();
			event.stopPropagation();
		}
	}

	centerImageFunc(event: MouseEvent) {		
		if (this.slideshow) {
			this.toggleSlideshow();
		} else {
			this.toggleMode();
		}
		
		event.preventDefault();
		event.stopPropagation();
	}

	ngAfterViewInit() {
		if (this.mode !== 'dark') {
			setTimeout(() => {
				this.clickMe();
			}, 2000);	
		}
		
		setTimeout(() => {
			this.showPoem = false;

			this.w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
			this.h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

			if (this.mode === 'light') {
				this.showOthers = false;
			} else if (this.mode === 'dark') {
				this.showOthers = true;
			} else {
				this.showOthers = false;

				this.modeTimeout = setTimeout(() => {
					this.setMode('light');
					this.showOthers = false;
				}, 1000);
	
				this.toggleModeTimeout = setTimeout(() => {
					this.toggleMode();
				}, 10000);
			}

			setTimeout(() => {
				this.getLinksContainerWidth();
	        	this.alignUrls();
	        	setTimeout(() => {
		       		this.recalcEvertyhing();
		    	}, 1);
			}, 1);
		},0);
	}

	setMode(mode: 'dark' | 'light' | ''): void {
		this.mode = mode;
		document.body.className = mode;
		this.appService.mode = mode;
	}

	toggleMode() {
		clearTimeout(this.modeTimeout);
		clearTimeout(this.toggleModeTimeout);

		this.started = true;

		if (this.mode === 'light') {
			if (this.slideshow) {
				this.toggleSlideshow();
			}

			this.setMode('');
			this.modeTimeout = setTimeout(() => {
				this.setMode('dark');
				setTimeout(() => {
		       		this.recalcEvertyhing();
				}, 1);
				
				this.modeTimeout = setTimeout(() => {
					if (this.mode === 'dark') {
						this.showOthers = true;
						setTimeout(() => {
				       		this.recalcEvertyhing();
				    	}, 1);
					}
				}, 2000);
			}, 500);
		} else {
			this.setMode('');
			this.showPoem = true;

			this.modeTimeout = setTimeout(() => {
				this.setMode('light');
				this.showOthers = false;
			}, 1000);
		}
	}

	getLinksContainerWidth() {
		if (this.linksContainer && this.linksContainer.nativeElement) {
			this.projectFontSize = parseFloat(window.getComputedStyle(this.linksContainer.nativeElement).fontSize) || 9.33;
			this.projectsMaxWidth = this.linksContainer.nativeElement.getBoundingClientRect().width;
		}
	}

	alignUrls() {
		var y = 0;

		var width = this.projectsMaxWidth;

		var i = 0;
		var count = 0;

		var topWidth = 0;

		this.projectRows = [];

		this.projectRows.push([]);

		var margin = 0;

		while (i < this.appService.projects.length) {
			// console.log(width);

			if (y === 0) {
				margin = 50;//70;//this.urlFontSize * 9;
			} else {
				margin = (this.projectsMaxWidth - topWidth) / (this.projectRows[0].length - 1);
			}

			const project = this.appService.projects[i];

			// console.log(url.width);

			if ((y > 0 || count < this.maxProjects) && project.width < width) {
				project.margin = margin;
				this.projectRows[y].push(project);
				width -= project.width + margin;

				if (y === 0) {
					topWidth += project.width;
				} else {
					project.marginRight = topWidth;
				}

				i += 1;
				count += 1;
			} else {
				if (width === this.projectsMaxWidth) {
					project.margin = margin;
					this.projectRows[y].push(project);

					if (y === 0) {
						topWidth += project.width
					} else {
						project.marginRight = topWidth;
					}

					i += 1;
					count += 1;
				}

				width = this.projectsMaxWidth;
				this.projectRows.push([]);
				y += 1;
				count = 0;
			}

			if (i > 99) {
				console.error("oops", i);
				M.toast({html: "Unexpected error: loop issue"});
				break;
			}
		}
	}

	ptToPx(pt: number) {
    	return pt * 96 / 72;
    }

    pxToPt(px: number) {
    	return px * 72 / 96;
    }

    getActive(el: HTMLElement) {
    	el.classList.add("active");
    }

    getNotActive(el: HTMLElement) {
    	el.classList.remove("active");
    }

    recalcEvertyhing() {
    	if (this.loading) {
    		return;
    	}

    	this.getLinksContainerWidth();
        this.alignUrls();

        this.w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		this.h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    }

    firebasePasswordLogin() {
	    if (this.authPending) {
			M.toast({html: 'Please wait', displayLength: 1250});
			return;
		}

	    if (!this.email) {
			M.toast({html: 'Please type your email', displayLength: 1250});
			return;
	    }

	    if (!this.password) {
			M.toast({html: 'Please type your password', displayLength: 1250});
			return;
		}
		
		this.authPending = true;

	    return firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(userCredential => {
			this.authPending = false;

			if (userCredential) {
				this.password = "";
				this.loggedIn = true;
				M.toast({html: 'Signed in', displayLength: 1250});
			} else {
				this.loggedIn = false;
				throw "Unexpected missing userCredential";
			}
		}).catch(error => {
			console.error(error);

			var errorMessage: string = "";

			if (error) {
				if (error.code) {
					if (error.code === 'auth/invalid-email') {
						errorMessage = "It appears your email is invalid";
					} else if (error.code === 'auth/user-disabled') {
						errorMessage = "It appears your account has been disabled";
					} else if (error.code === 'auth/user-not-found') {
						errorMessage = "It appears your email has not been registered";
					} else if (error.code === 'auth/wrong-password') {
						errorMessage = "Incorrect password";
					}
				}
			}

			errorMessage = errorMessage || 'Unknown error';

			M.toast({html: errorMessage, displayLength: 1250});
	    }).then(() => {
			this.authPending = false;
		})
	}

	firebaseRequestPasswordReset() {
		if (this.authPending) {
			M.toast({html: 'Please wait', displayLength: 1250});
			return;
		}

		this.authPending = true;

		var emailAddress = this.email;//"mark.thompson@smpl.company";
		// var emailAddress = "sam@samanthamink.com";

		let url = window.location.protocol + "//" + window.location.hostname;

		if (url === 'http://localhost') {
			url += ":" + window.location.port;
		}

		console.log(url);

		return firebase.auth().sendPasswordResetEmail(emailAddress, {url: url}).then(() => {
			M.toast({html: 'Password reset sent. Please check your email', displayLength: 1250});
		}).catch(error => {
			console.error(error);

			let errorMessage = "";

			if (error) {
				errorMessage = error.message;
			}

			errorMessage = errorMessage || 'Unknown error';

			M.toast({html: errorMessage, displayLength: 1250});
		}).then(() => {
			this.authPending = false;			
		});
	}

	authHandler() {
		firebase.auth().onAuthStateChanged(user => {
          this.ngZone.run(() => {
          	if (user) {
          		this.loggedIn = true;
          	} else {
          		this.loggedIn = false;
          	}
          });
      	});
	}

	logUserOut() {
		if (this.authPending) {
			M.toast({html: 'Please wait', displayLength: 1250});
			return;
		}

		this.authPending = true;

		if (this.showManagement) {
			this.toggleShowManagement();		
		}

		return firebase.auth().signOut().then(() => {
			M.toast({html: 'Signed out', displayLength: 1250});

			this.authPending = false;

			// console.log('signed out');
			this.loggedIn = false;
			this.showLogin = false;
		}, error => {
		  	console.error(error);
			M.toast({html: 'Unknown error', displayLength: 1250});
			this.authPending = false;
		});
	}

	setActiveManagementOption(option) {
		this.activeManagementOption = option;
	}

	getNewProject(): Project {
		return {
			text: "",
			href: "",
			useSlideshow: false,
			desc: "",
			imageUrls: [],
			tags: [],

			width: 0,
			margin: 0,
			marginRight: 0,
		}
	}

	insertProject(index: number) {
		this.appService.projects.splice(index + 1, 0, this.getNewProject());
		M.toast({html: `New project added, #${index + 2}`, displayLength: 1250});
	}

	removeProject(index: number) {
		const project = this.appService.projects[index];

		const projectIsEmpty = !project.text || !project.href;// TODO: update to handle advance

		if (projectIsEmpty || confirm(`Are you sure you want to remove the project "${project.text}"?`)) {
			console.log(this.appService.projects[index]);
			this.appService.projects.splice(index, 1);

			if (project.text) {
				M.toast({html: `Project ${project.text} was removed`, displayLength: 1250});
			} else if (project.href) {
				M.toast({html: `Project #${index + 1} was removed`, displayLength: 1250});
			}

		}
	}

	toggleAdvancedProject(index: number) {
		this.appService.projects[index].useSlideshow = !this.appService.projects[index].useSlideshow;
	}

	setAdvanceEdit(index: number) {
		this.setActiveManagementOption('advancedEdit');
	}

	toggleShowManagement() {
		clearTimeout(this.toggleModeTimeout);
		this.showManagement = !this.showManagement;

		setTimeout(() => {
			this.getLinksContainerWidth();
			this.alignUrls();
			setTimeout(() => {
				   this.recalcEvertyhing();
			}, 1);
		}, 1);
	}

	save() {
		if (this.saving) {
			M.toast({html: 'Please wait', displayLength: 1250});
			return;
		}

		if (!confirm(`Are you sure you want to save? You can hide/show to preview your changes before saving.`)) {
			return;
		}

		let warningMessage = "";
		let warningCount = 0;

		for (let i = 0; i < this.appService.projects.length; i++) {
			const project = this.appService.projects[i];

			if (this.isEmptyProject(project.text)) {
				warningMessage = warningMessage || `Project #${i + 1} appears to have no name.`;
				warningCount += 1;
			}

			if (this.isInvalidUrl(project.href)) {
				warningMessage = warningMessage || `Project #${i + 1}, "${project.text}" appears to have an invalid url.`;
				warningCount += 1;
			}
		}

		for (let i = 0; i < this.appService.footerUrls.length; i++) {
			const footerUrl = this.appService.footerUrls[i];

			if (this.isEmptyProject(footerUrl.text)) {
				warningMessage = warningMessage || `Footer item #${i + 1} appears to have no name.`;
				warningCount += 1;
			}

			if (this.isInvalidUrl(footerUrl.href)) {
				warningMessage = warningMessage || `Footer item #${i + 1}, "${footerUrl.text}" appears to have an invalid url.`;
				warningCount += 1;
			}
		}

		console.log(warningCount);

		if (warningCount > 1) {
			const otherWarningsCount = warningCount - 1;

			if (otherWarningsCount === 1) {
				warningMessage += ` And there is ${otherWarningsCount} other issue.`;
			} else {
				warningMessage += ` And there are ${otherWarningsCount} other issues.`;
			}
		}

		if (warningCount) {
			if (!confirm(warningMessage + ` Are you sure you want to continue?`)) {
				return;
			}
		}

		this.saving = true;

		const app = {
			projects: this.appService.projects || [],
			footers: this.appService.footerUrls || [],
		};

		return firebase.database().ref('prod').set(app).then(() => {
			return firebase.database().ref(`timestamps/${Date.now()}`).set(app);
		}).then(() => {
			this.saving = false;
			M.toast({html: 'Saved!', displayLength: 1250});
		}).catch(error => {
			console.error(error);

			let errorMessage = 'Unknown error';

			if (error && error.message) {
				errorMessage = error.message;
			}

			errorMessage = errorMessage || 'Unknown error';
			M.toast({html: errorMessage, displayLength: 1250});

			this.saving = false;
		});
	}

	// https://scotch.io/tutorials/responsive-equal-height-with-angular-directive
	@HostListener('window:resize')
    onResize() {
    	// '{
    	setTimeout(() => {
       		this.recalcEvertyhing();
       	}, 1);
    }

    @HostListener('window:orientationchange')
    onOrientationChange() {
    	// '{
    	setTimeout(() => {
       		this.recalcEvertyhing();
    	}, 1);
    }

    // Class stuff
    hasClass(el: HTMLElement, name: string) {
        return new RegExp('(?:^|\\s+)' + name + '(?:\\s+|$)').test(el.className);
    }

    addClass(el: HTMLElement, name: string) {
        if (!this.hasClass(el, name)) {
            el.className = el.className ? [el.className, name].join(' ') : name;
        }
    }

    removeClass(el: HTMLElement, name: string) {
        if (this.hasClass(el, name)) {
            el.className = el.className.replace(new RegExp('(?:^|\\s+)' + name + '(?:\\s+|$)', 'g'), '');
        }
    }
    // End Class stuff

	ngOnDestroy() {
		// destroy all the subscriptions at once
		// this.subs.unsubscribe();
	}
}