/**
 * Use options that are set outside.
 */
var wisData = wisJSX;

/**
 * Set Router variables.
 */
var { Router, Route, IndexRoute, Link, browserHistory } = ReactRouter;

/**
 * Report submission event holder.
 */
var ReportFormSumission = {};

/**
 * Main panel.
 */
var PanelBox = React.createClass( {
	getInitialState: function() {
		return {
			loading: true,
			data: []
		};
	},
	loadDataFromServer: function() {
		jQuery.ajax( {
			method: 'GET',
			url: wisData.EndpointBase + this.props.endpoint,
			dataType: 'json',
			cache: false,
			crossDomain: true,
			data: { width: jQuery( window ).width() },
			success: function( data ) {
				this.setState( { loading: false } );
				this.setState( { data: data } );
			}.bind( this ),
			error: function( xhr, status, err ) {
				console.error( this.props.endpoint, status, err.toString() );
			}.bind( this )
		} );
	},
	componentWillMount: function() {
		this.loadDataFromServer();
	},
	panel: function() {
		if ( true != this.state.loading ) {
			return (
				<div className="panel panel-default">
					{this.panelHeading()}
					{this.panelBody()}
				</div>
			);
		}
	},
	panelHeading: function() {
		if ( true != this.state.loading ) {
			var headingName = 'vus-' + this.state.data.id + '-heading';

			return (
				<div className="panel-heading">
					<h3 id={headingName} className="panel-title">
						{this.state.data.name}
					</h3>
				</div>
			);
		}
	},
	panelBody: function() {
		if ( true != this.state.loading ) {
			if ( 'thumbnails' != this.state.data.type ) {
				return <PanelBodyBox data={this.state.data} />;
			}
		}
	},
	render: function() {
		return (
			<div>
				{ this.state.loading ? <LoadingBox /> : null }
				<div className="container">
					<div className="row">
						<div className="col-xs-12">
							{this.panel()}
						</div>
					</div>
				</div>
				{ 'thumbnails' == this.state.data.type ? <ThumbnailsBox data={this.state.data.thumbnails} /> : null }
			</div>
		);
	}
} );

var PanelBodyBox = React.createClass( {
	panelBody: function() {
		// Display different content based on type
		if ( 'weather' == this.props.data.type ) {
			return <WeatherBox data={this.props.data.cities} />;
		} else if ( 'forecast' == this.props.data.type ) {
			return <ForecastsBox data={this.props.data.forecasts} />;
		} else if ( 'report' == this.props.data.type ) {
			return <ReportsBox data={this.props.data.reports} />;
		} else if ( 'reporting' == this.props.data.type ) {
			return <ReportButton />;
		}
	},
	render: function() {
		return (
			<div className="panel-collapse collapse in">
				<div className="panel-body">
					{this.panelBody()}
				</div>
			</div>
		);
	}
} );

var ThumbnailsBox = React.createClass( {
	render: function() {
		var thumbnailNodes = this.props.data.map( function( thumbnail, index ) {
			return (
				<ThumbnailBox key={thumbnail.id} data={thumbnail} />
			);
		} );

		return (
			<div className="thumbnails-list">
				{thumbnailNodes}
			</div>
		);
	}
} );

var ThumbnailBox = React.createClass( {
	render: function() {
		return (
			<div>
				<div className="container">
					<div className="row">
						<div className="col-xs-12">
							<h4 className="text-uppercase">{this.props.data.title}</h4>
						</div>
					</div>
				</div>
				<img className="img-responsive center-block" src={this.props.data.image} />
				<div className="container">
					<div className="row">
						<div className="col-xs-12">
							<p><b>{this.props.data.caption}</b></p>
						</div>
					</div>
				</div>
			</div>
		);
	}
} );

var WeatherBox = React.createClass( {
	render: function() {
		var weatherNodes = this.props.data.map( function( city, index ) {
			return (
				<CityWeatherBox key={city.id} data={city} />
			);
		} );

		return (
			<div className="list-group">
				{weatherNodes}
			</div>
		);
	}
} );

var CityWeatherBox = React.createClass( {
	render: function() {
		return (
			<div className="list-group-item">
				<h4 className="list-group-item-heading">{this.props.data.formatted_name}</h4>
				<p className="list-group-item-text">{this.props.data.formatted_text}</p>
			</div>
		);
	}
} );

var ForecastsBox = React.createClass( {
	render: function() {
		var forecastNodes = this.props.data.map( function( forecast, index ) {
			return (
				<ForecastBox key={forecast.id} data={forecast} />
			);
		} );

		return (
			<div>
				{forecastNodes}
			</div>
		);
	}
} );

var ForecastBox = React.createClass( {
	render: function() {
		return (
			<div className="media">
				<div className="media-body">
					<h4 className="media-heading">{this.props.data.title}</h4>
					<p className="text-left text-muted"><em><time dateTime={this.props.data.w3c_time}>{this.props.data.human_time}</time></em></p>
					<p dangerouslySetInnerHTML={{__html: this.props.data.description}} />
					<p className="text-right"><em><strong>{this.props.data.name}</strong></em></p>
				</div>
			</div>
		);
	}
} );

var ReportsBox = React.createClass( {
	getInitialState: function() {
		return {
			hasReports: false,
			data: []
		};
	},
	componentWillMount: function() {
		// If there are reports passed, set that there are reports
		if ( this.props.data.length > 0 ) {
			this.setState( { hasReports: true } );
		}

		// Set passed data
		this.setState( { data: this.props.data } );
	},
	componentDidMount: function() {
		// Prepend submitted report
		jQuery( ReportFormSumission ).on( 'submitted', function( event, report ) {
			// Get current time in MySQl format per http://stackoverflow.com/a/11150727
			report.time = new Date().toISOString().slice( 0, 19 ).replace( 'T', ' ' );

			// Get current time per http://stackoverflow.com/a/221297
			var currentUnixMiliseconds = new Date().getTime();

			// Add unique ID from current time
			report.id = 'report-' + currentUnixMiliseconds;

			// Store that this is new report
			report.new = true;

			// Start new reports array from old ones
			var newReports = this.state.data;

			// Prepend new report to array
			newReports.unshift( report );

			// Set new reports array as current
			this.setState( { data: newReports } );

			// Set that there are reports
			this.setState( { hasReports: true } );
		}.bind( this ) );

		// Animate background of prepended report
		jQuery( '.wus-reports-list blockquote:first-child' ).animate( {
			background: "red"
		}, 2000	);
	},
	componentWillUnmount: function () {
		jQuery( ReportFormSumission ).off( 'submitted' );
	},
	render: function() {
		var reportNodes = this.state.data.map( function( report, index ) {
			return (
				<ReportBox key={report.id} data={report} />
			);
		} );

		return (
			<div>
				<div className="panel panel-default">
					<div className="panel-body">
						<ReportButton />
					</div>
				</div>
				{ this.state.hasReports ? <ReportsSubPanel reportNodes={reportNodes} /> : null }
			</div>
		);
	}
} );

var ReportsSubPanel = React.createClass( {
	render: function() {
		return (
			<div className="panel panel-default">
				<div className="panel-body wus-reports-list">
					{this.props.reportNodes}
				</div>
			</div>
		);
	}
} );

var ReportBox = React.createClass( {
	age: function() {
		if ( this.props.data.new ) {
			return 'bg-success';
		} else {
			return;
		}
	},
	render: function() {
		return (
			<blockquote className={this.age()}>
				<p>{this.props.data.text}</p>
				<footer><cite>{this.props.data.author}</cite>,&nbsp;{this.props.data.time} ({this.props.data.place})</footer>
			</blockquote>
		);
	}
} );

var ReportForm = React.createClass( {
	handleSubmit: function( e ) {
		e.preventDefault();

		var author = this.refs.author.value.trim();
		var place = this.refs.place.value.trim();
		var text = this.refs.text.value.trim();

		if ( ! text || ! author || ! place ) {
			return;
		}

		this.props.onReportSubmit( { author: author, place: place, text: text } );
		this.refs.author.value = '';
		this.refs.place.value = '';
		this.refs.text.value = '';
	},
	render: function() {
		return (
			<div className="wis-report-form collapse">
				<div className="">
					<form className="form-horizontal" onSubmit={this.handleSubmit}>
						<div className="form-group">
							<label htmlFor="vus-report-form-author" className="col-sm-2 control-label">Име</label>
							<div className="col-sm-10">
								<input id="vus-report-form-author" type="text" className="form-control" placeholder="Име" ref="author" />
							</div>
						</div>
						<div className="form-group">
							<label htmlFor="vus-report-form-place" className="col-sm-2 control-label">Место</label>
							<div className="col-sm-10">
								<input id="vus-report-form-place" type="text" className="form-control" placeholder="Место" ref="place" />
							</div>
						</div>
						<div className="form-group">
							<label htmlFor="vus-report-form-text" className="col-sm-2 control-label">Опис</label>
							<div className="col-sm-10">
								<textarea id="vus-report-form-text" className="form-control" placeholder="Опис" ref="text"></textarea>
							</div>
						</div>
						<div className="form-group">
							<div className="col-sm-offset-2 col-sm-10">
								<button type="submit" className="btn btn-default">Предај</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		);
	}
} );

var ReportButton = React.createClass( {
	getInitialState: function() {
		return { showForm: false };
	},
	onClick: function() {
		//this.state.showForm ? this.setState( { showForm: false } ) : this.setState( { showForm: true } );
		jQuery( '.wis-report-form' ).collapse( 'toggle' );
	},
	handleReportSubmit: function( report ) {
		jQuery.ajax( {
			method: 'POST',
			url: wisData.EndpointBase + 'wis/v1/reports',
			dataType: 'json',
			cache: false,
			crossDomain: true,
			data: report,
			success: function( data ) {
				//console.log( data );
			}.bind(this),
			error: function( xhr, status, err ) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		} );

		jQuery( ReportFormSumission ).trigger( 'submitted', report );

		// Hide form
		this.onClick();
	},
	render : function(){
		return (
		<div>
			<button className="btn btn-default" onClick={this.onClick}>
				Предај извештај
			</button>
			{ this.state.showForm ? <ReportForm onReportSubmit={this.handleReportSubmit} /> : null }
			<ReportForm onReportSubmit={this.handleReportSubmit} />
		</div>
		);
	}
} );

var LoadingBox = React.createClass( {
	render: function() {
		var style = {
		  width: '100%'
		};

		return (
			<div className="container">
				<div className="row">
					<div className="col-xs-12">
						<div className="text-center">
							<div className="progress">
								<div className="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style={style}></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
} );

/**
 * Index content.
 *
 * Load separate boxes by passing
 * their API endpoint.
 */
var IndexContent = React.createClass( {
	render: function() {
		return (
			<div>
				<PanelBox endpoint="wis/v1/reports" />
				<PanelBox endpoint="wis/v1/weather" />
			</div>
		);
	}
} );

/**
 * Radar content.
 *
 * Load separate box by passing
 * its API endpoint.
 */
var RadarContent = React.createClass( {
	render: function() {
		return (
			<div>
				<PanelBox endpoint="wis/v1/radar" />
			</div>
		);
	}
} );

/**
 * Satellite content.
 *
 * Load separate box by passing
 * its API endpoint.
 */
var SatelliteContent = React.createClass( {
	render: function() {
		return (
			<div>
				<PanelBox endpoint="wis/v1/satellite" />
			</div>
		);
	}
} );

/**
 * Lightning content.
 *
 * Load separate box by passing
 * its API endpoint.
 */
var LightningContent = React.createClass( {
	render: function() {
		return (
			<div>
				<PanelBox endpoint="wis/v1/lightning" />
			</div>
		);
	}
} );

/**
 * Forecast content.
 *
 * Load separate box by passing
 * its API endpoint.
 */
var ForecastContent = React.createClass( {
	render: function() {
		return (
			<div>
				<PanelBox endpoint="wis/v1/forecast" />
			</div>
		);
	}
} );

/**
 * Main Screen.
 */
var MainScreen = React.createClass( {
	render: function() {
		return (
			<div id="container">
				<div id="content">
					<div className="container">
						<div className="row">
							<div className="col-xs-12">
								<nav className="navbar navbar-default">
									<div className="container-fluid">
										<div className="collapse navbar-collapse">
											<ul className="nav navbar-nav">
												<li><Link to="/">Стање</Link></li>
												<li><Link to="/radar/">Радар</Link></li>
												<li><Link to="/satellite/">Сателит</Link></li>
												<li><Link to="/lightning/">Муње</Link></li>
												<li><Link to="/forecast/">Прогноза</Link></li>
											</ul>
										</div>
									</div>
								</nav>
							</div>
						</div>
					</div>
					<div>
						{this.props.children}
					</div>
				</div>
			</div>
		);
	}
} );

/**
 * Start rendering content.
 */
ReactDOM.render( (
	<Router history={browserHistory}>
		<Route path="/" component={MainScreen}>
			<IndexRoute component={IndexContent} />
			<Route path="/radar/" component={RadarContent} />
			<Route path="/satellite/" component={SatelliteContent} />
			<Route path="/lightning/" component={LightningContent} />
			<Route path="/forecast/" component={ForecastContent} />
		</Route>
	</Router>
), document.getElementById( 'wis-content' ) );
